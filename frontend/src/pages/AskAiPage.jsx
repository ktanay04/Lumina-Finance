import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, MessageSquarePlus } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AskAiPage() {
  const { showToast } = useToast();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/ai/conversation/latest');
        if (cancelled || !data?.messages?.length) return;
        setConversationId(data.conversationId);
        setMessages(data.messages);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', content: text };
    const nextThread = [...messages, userMsg];
    setInput('');
    setMessages(nextThread);
    setSending(true);

    try {
      const { data } = await api.post('/api/ai/chat', {
        messages: nextThread,
        ...(conversationId ? { conversationId } : {}),
      });
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 503
          ? 'Ask AI is not configured on the server (missing SARVAM_API_KEY).'
          : 'Could not reach the AI. Try again.');
      showToast({ title: 'Ask AI', message: msg, variant: 'danger' });
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-7 w-7 text-violet-400" aria-hidden />
          <h1 className="text-2xl font-semibold tracking-tight">Ask AI</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Questions are answered using{' '}
          <span className="text-zinc-300">Sarvam</span> with your Lumina transactions as context
          (see{' '}
          <a
            href="https://docs.sarvam.ai/api-reference-docs/api-guides-tutorials/chat-completion/overview"
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300"
          >
            Sarvam chat docs
          </a>
          {'). '}
          Add <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">SARVAM_API_KEY</code> in{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env</code> at the project root.
        </p>
        </div>
        <button
          type="button"
          onClick={startNewChat}
          disabled={sending || hydrating}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-violet-500/40 hover:bg-violet-600/15 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          New chat
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-card/60 shadow-xl ring-1 ring-black/30">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
        >
          {hydrating ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" aria-hidden />
              Loading saved conversation…
            </div>
          ) : null}

          {!hydrating && messages.length === 0 && !sending ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-zinc-500">
              Ask anything about your spending, income, categories, or trends. Each reply uses your
              current transaction history on the server. Chats are saved to your account.
            </div>
          ) : null}

          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/40'
                    : 'border border-white/10 bg-zinc-900/80 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" aria-hidden />
                Thinking…
              </div>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/10 p-4 sm:p-5">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your transactions…"
              rows={2}
              disabled={sending || hydrating}
              className="min-h-[3rem] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className="flex shrink-0 items-center justify-center self-end rounded-xl bg-violet-600 px-4 py-3 text-white shadow-lg shadow-violet-900/25 transition hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Send className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-600">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
