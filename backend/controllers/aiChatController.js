const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AiConversation = require('../models/AiConversation');

const SARVAM_URL = 'https://api.sarvam.ai/v1/chat/completions';
const MAX_TX_FETCH = 2000;
const MAX_MESSAGES = 40;
const MAX_CONTENT_LEN = 12000;
/** Max stored messages per conversation (user + assistant turns). */
const MAX_STORED_MESSAGES = 80;

function serializeTransactions(docs) {
  return docs.map((t) => ({
    id: String(t._id),
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date ? new Date(t.date).toISOString().slice(0, 10) : null,
    notes: (t.notes && String(t.notes).trim()) || '',
  }));
}

function validateClientMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages must be a non-empty array';
  }
  if (messages.length > MAX_MESSAGES) {
    return `At most ${MAX_MESSAGES} messages allowed`;
  }
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'Invalid message entry';
    if (m.role !== 'user' && m.role !== 'assistant') {
      return 'Each message role must be user or assistant';
    }
    if (typeof m.content !== 'string') return 'Message content must be a string';
    if (m.content.length > MAX_CONTENT_LEN) return 'Message too long';
    if (m.content.trim().length === 0) return 'Messages cannot be empty';
  }
  if (messages.at(-1).role !== 'user') {
    return 'The last message must be from the user';
  }
  return null;
}

function conversationTitleFromFirstUserMessage(messages) {
  const first = messages.find((m) => m.role === 'user');
  const raw = first?.content?.trim() || '';
  if (!raw) return 'Ask AI conversation';
  const line = raw.split('\n')[0];
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

function parseConversationId(body) {
  const raw = body?.conversationId;
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s || !mongoose.Types.ObjectId.isValid(s)) return null;
  return s;
}

const getLatestConversation = async (req, res) => {
  try {
    const conv = await AiConversation.findOne({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title messages updatedAt')
      .lean();

    if (!conv || !conv.messages?.length) {
      return res.json(null);
    }

    return res.json({
      conversationId: String(conv._id),
      title: conv.title,
      updatedAt: conv.updatedAt,
      messages: conv.messages.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const chatWithSarvam = async (req, res) => {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        message: 'AI is not configured. Add SARVAM_API_KEY to your project root .env file.',
      });
    }

    const errMsg = validateClientMessages(req.body?.messages);
    if (errMsg) {
      return res.status(400).json({ message: errMsg });
    }

    const { messages: clientMessages } = req.body;
    const existingId = parseConversationId(req.body);

    const totalCount = await Transaction.countDocuments({ user: req.user._id });
    const slice = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(MAX_TX_FETCH)
      .lean();
    const chronological = slice.slice().reverse();
    const truncated = totalCount > chronological.length;

    const payload = {
      currency: 'INR',
      transactionCountListed: chronological.length,
      totalTransactionsInDatabase: totalCount,
      truncated,
      transactions: serializeTransactions(chronological),
    };

    const systemContent = [
      'You are the "Ask AI" assistant in Lumina Finance, a personal expense and budget app for Indian users.',
      'All amounts are in Indian Rupees (INR). Use the JSON transaction data below as the source of truth for questions about spending, income, categories, dates, and trends.',
      'If truncated is true, only the most recent transactions (up to the limit) were sent — older rows exist in the database but are omitted from this context.',
      'Be concise, friendly, and practical. If asked something unrelated to their data, answer briefly and offer to help with their finances.',
      '',
      'User transaction data (JSON):',
      JSON.stringify(payload),
    ].join('\n');

    const model = process.env.SARVAM_MODEL || 'sarvam-30b';

    const outboundMessages = [
      { role: 'system', content: systemContent },
      ...clientMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const upstream = await fetch(SARVAM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: outboundMessages,
        temperature: 0.45,
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const detail = data?.error?.message || upstream.statusText || 'Upstream request failed';
      console.error('Sarvam chat error', upstream.status, data);
      return res.status(502).json({ message: detail });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(502).json({ message: 'Unexpected response from AI provider' });
    }

    const reply = text.trim();
    const fullMessages = [
      ...clientMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'assistant', content: reply },
    ];
    const trimmed =
      fullMessages.length > MAX_STORED_MESSAGES
        ? fullMessages.slice(-MAX_STORED_MESSAGES)
        : fullMessages;

    let convId;
    if (existingId) {
      const conv = await AiConversation.findOne({ _id: existingId, user: req.user._id });
      if (!conv) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      conv.messages = trimmed;
      await conv.save();
      convId = String(conv._id);
    } else {
      const conv = await AiConversation.create({
        user: req.user._id,
        title: conversationTitleFromFirstUserMessage(clientMessages),
        messages: trimmed,
      });
      convId = String(conv._id);
    }

    return res.json({
      message: reply,
      conversationId: convId,
      meta: {
        model: data.model || model,
        transactionRowsUsed: chronological.length,
        totalTransactions: totalCount,
        truncated,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { chatWithSarvam, getLatestConversation };
