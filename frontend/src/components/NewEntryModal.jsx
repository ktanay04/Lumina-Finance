import { useState, useRef, useEffect } from 'react';
import { X, Camera, Mic, ArrowDownCircle, ArrowUpCircle, Upload, Trash2 } from 'lucide-react';
import api from '../services/api';
import { categoriesForType } from '../constants/categories';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { formatCurrency } from '../utils/format';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NewEntryModal({ open, onClose, onSaved }) {
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Housing');
  const [date, setDate] = useState(todayInputValue());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);

  const cats = categoriesForType(type);

  const parseVoiceDate = (text) => {
    const lower = text.toLowerCase();
    const today = new Date();

    if (lower.includes('today')) {
      return today.toISOString().slice(0, 10);
    }
    if (lower.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      return yesterday.toISOString().slice(0, 10);
    }

    const monthMap = {
      january: '01', jan: '01', february: '02', feb: '02', march: '03', mar: '03',
      april: '04', apr: '04', may: '05', june: '06', jun: '06', july: '07', jul: '07',
      august: '08', aug: '08', september: '09', sep: '09', october: '10', oct: '10',
      november: '11', nov: '11', december: '12', dec: '12',
    };

    const explicitMonthDay = lower.match(/(?:on\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?/i);
    const explicitDayMonth = lower.match(/(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i);
    const slashMatch = lower.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

    if (explicitMonthDay) {
      const day = String(explicitMonthDay[1]).padStart(2, '0');
      const monthKey = explicitMonthDay[2].toLowerCase();
      const month = monthMap[monthKey] || '01';
      const year = explicitMonthDay[3] || today.getFullYear();
      return `${year}-${month}-${day}`;
    }

    if (explicitDayMonth) {
      const day = String(explicitDayMonth[2]).padStart(2, '0');
      const monthKey = explicitDayMonth[1].toLowerCase();
      const month = monthMap[monthKey] || '01';
      const year = explicitDayMonth[3] || today.getFullYear();
      return `${year}-${month}-${day}`;
    }

    if (slashMatch) {
      const [_, part1, part2, yearRaw] = slashMatch;
      const day = part1.padStart(2, '0');
      const month = part2.padStart(2, '0');
      const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const parseVoiceAmount = (text) => {
    const lower = text.toLowerCase();
    const explicit = lower.match(/(?:rupees|rs\.?|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    if (explicit) return parseFloat(explicit[1]);

    const actionBased = lower.match(/(?:paid|spent|cost|worth|gave|bought)\s+([0-9]+(?:\.[0-9]{1,2})?)/);
    if (actionBased) return parseFloat(actionBased[1]);

    const trailing = lower.match(/([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rupees|rs\.?|₹)/);
    if (trailing) return parseFloat(trailing[1]);

    return null;
  };

  const mapCategory = (text) => {
    const lower = text.toLowerCase();
    const categoryKeywords = {
      Housing: ['housing', 'house', 'rent', 'home'],
      Transportation: ['transport', 'taxi', 'bus', 'train', 'uber', 'ola', 'auto', 'fuel', 'petrol', 'cab', 'flight', 'ticket'],
      Food: ['food', 'restaurant', 'grocery', 'groceries', 'meal', 'lunch', 'dinner', 'breakfast', 'coffee', 'snack', 'cafe'],
      Utilities: ['utility', 'utilities', 'electricity', 'water', 'internet', 'phone', 'bill'],
      Insurance: ['insurance', 'premium'],
      Medical: ['medical', 'doctor', 'health', 'pharmacy', 'medicine', 'hospital', 'clinic'],
      'Saving & Investing': ['saving', 'investing', 'investment', 'deposit'],
      'Personal Spending': ['personal', 'shopping', 'clothes', 'gift', 'fashion', 'cosmetic', 'accessory', 'spa', 'hair'],
      Entertainment: ['entertainment', 'movie', 'cinema', 'concert', 'game', 'netflix', 'music', 'theatre'],
      Miscellaneous: ['misc', 'other', 'random'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return cat;
      }
    }

    return null;
  };

  const parseVoiceText = (text) => {
    const lower = text.toLowerCase();
    const amount = parseVoiceAmount(lower);
    const category = mapCategory(lower);
    const date = parseVoiceDate(text);

    const notes = text.replace(/(paid|spent|cost|for|on|today|yesterday|rupees|rs\.?|₹)/gi, '').trim();

    return {
      amount,
      category,
      date,
      notes: notes || text,
    };
  };

  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setVoiceSupported(supported);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop?.();
      }
    };
  }, []);

  const getRecognition = () => {
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return null;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const spoken = event.results?.[0]?.[0]?.transcript || '';
        setTranscript(spoken);
        const extracted = parseVoiceText(spoken);

        if (!extracted.amount || !extracted.category || !extracted.date) {
          setVoiceError(
            'Please specify amount, category, and date. Example: "Paid 650 rupees for groceries on October 12th."'
          );
          setVoiceActive(false);
          return;
        }

        setAmount(extracted.amount.toString());
        setCategory(extracted.category);
        setDate(extracted.date);
        setNotes(extracted.notes);
        setVoiceActive(false);
        showToast({
          variant: 'info',
          title: 'Voice input captured',
          message: 'Voice entry parsed. Review the extracted transaction details before saving.',
        });
      };

      recognition.onerror = (event) => {
        setVoiceError(`Voice input error: ${event.error || 'unknown error'}`);
        setVoiceActive(false);
      };

      recognition.onend = () => {
        setVoiceActive(false);
      };

      recognitionRef.current = recognition;
    }
    return recognitionRef.current;
  };

  const handleVoiceToggle = () => {
    setVoiceError('');
    if (!voiceSupported) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    const recognition = getRecognition();
    if (!recognition) {
      setVoiceError('Unable to initialize voice recognition.');
      return;
    }

    if (voiceActive) {
      recognition.stop();
      return;
    }

    setTranscript('');
    setVoiceActive(true);
    try {
      recognition.start();
    } catch (err) {
      setVoiceError('Could not start voice input. Please try again.');
      setVoiceActive(false);
    }
  };

  if (!open) return null;

  const compressImage = (base64String, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Max dimensions
      let { width, height } = img;
      const maxWidth = 800;
      const maxHeight = 800;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG with quality 0.7
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64String;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const originalBase64 = event.target?.result;
      
      // Compress image to reduce token usage
      compressImage(originalBase64, async (compressedBase64) => {
        const base64 = compressedBase64.split(',')[1];
        if (!base64) {
          setError('Failed to process image');
          return;
        }

        setUploadedImage(originalBase64);
        setScanLoading(true);
        setError('');

        try {
          const { data } = await api.post('/api/ai/scan-receipt', { imageBase64: base64 });

          // Validate and extract data
          const extractedAmount = parseFloat(data.amount);
          const extractedCategory = data.category;
          const extractedDate = data.date;

          if (!isNaN(extractedAmount) && extractedAmount > 0) {
            setAmount(extractedAmount.toString());
          }

          // Normalize category name to match available categories
          const normalizedCategory = normalizeCategoryName(extractedCategory);
          if (cats.includes(normalizedCategory)) {
            setCategory(normalizedCategory);
          } else {
            // Try to find a close match
            const closeMatch = findClosestCategory(extractedCategory, cats);
            if (closeMatch) {
              setCategory(closeMatch);
            }
          }

          if (extractedDate) {
            setDate(extractedDate);
          }

          if (data.merchant) {
            setNotes(data.merchant);
          }

          setScannedData(data);
          showToast({
            variant: 'success',
            title: 'Receipt scanned',
            message: 'Receipt details have been extracted. Please review and adjust as needed.',
          });
        } catch (err) {
          const errorMsg = err.response?.data?.message || 'Failed to scan receipt. Please try again.';
          setError(errorMsg);
          showToast({
            variant: 'error',
            title: 'Scan failed',
            message: errorMsg,
          });
        } finally {
          setScanLoading(false);
        }
      });
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const normalizeCategoryName = (categoryName) => {
    if (!categoryName) return 'Miscellaneous';
    const lower = categoryName.toLowerCase().trim();

    // Direct mapping to actual categories
    const categoryMap = {
      food: 'Food',
      groceries: 'Food',
      restaurants: 'Food',
      transport: 'Transportation',
      transportation: 'Transportation',
      taxi: 'Transportation',
      fuel: 'Transportation',
      car: 'Transportation',
      gas: 'Transportation',
      entertainment: 'Entertainment',
      movies: 'Entertainment',
      music: 'Entertainment',
      shopping: 'Personal Spending',
      healthcare: 'Medical',
      medical: 'Medical',
      doctor: 'Medical',
      pharmacy: 'Medical',
      utilities: 'Utilities',
      electricity: 'Utilities',
      water: 'Utilities',
      internet: 'Utilities',
      housing: 'Housing',
      rent: 'Housing',
      insurance: 'Insurance',
      saving: 'Saving & Investing',
      investing: 'Saving & Investing',
      investment: 'Saving & Investing',
      miscellaneous: 'Miscellaneous',
    };

    return categoryMap[lower] || 'Miscellaneous';
  };

  const findClosestCategory = (scannedCategory, availableCategories) => {
    const lowerScanned = (scannedCategory || '').toLowerCase();
    for (const cat of availableCategories) {
      if (lowerScanned.includes(cat.toLowerCase()) || cat.toLowerCase().includes(lowerScanned)) {
        return cat;
      }
    }
    return null;
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setScannedData(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num < 0) {
      setError('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/transactions', {
        type,
        amount: num,
        category,
        date: new Date(date).toISOString(),
        notes,
      });
      const id = data?._id ? `lumina_tx_saved_${data._id}` : `lumina_tx_saved_${Date.now()}`;
      const kind = type === 'income' ? 'Income' : 'Expense';
      const detail = `${formatCurrency(data?.amount ?? num)} · ${category} (${kind})`;
      const message = `${detail}. This entry has been added to your transactions history.`;
      addNotification({
        id,
        variant: 'info',
        title: 'Transaction saved',
        message,
      });
      showToast({
        variant: 'info',
        title: 'Transaction saved',
        message: 'This entry has been added to your transactions history.',
      });
      onSaved?.();
      onClose();
      setAmount('');
      setNotes('');
      setType('expense');
      setCategory('Housing');
      setDate(todayInputValue());
      setUploadedImage(null);
      setScannedData(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-surface-card p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">New Entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanLoading}
            title="Scan receipt with AI"
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 py-3 text-sm font-medium text-violet-300 transition hover:border-violet-500/60 hover:bg-violet-500/10 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            {scanLoading ? 'Scanning…' : 'Scan Receipt'}
          </button>
          <button
            type="button"
            onClick={handleVoiceToggle}
            title="Record transaction details with your voice"
            className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition ${
              voiceActive
                ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                : 'border-emerald-500/40 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/10'
            } ${voiceError ? 'ring-2 ring-red-500/40' : ''}`}
          >
            <Mic className="h-4 w-4" />
            {voiceActive ? 'Listening…' : 'Voice Input'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={scanLoading}
        />

        {voiceSupported ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-surface-raised p-4 text-sm text-zinc-300">
            <p className="mb-2 font-semibold text-white">Voice entry instructions</p>
            <p>Start speaking to add a transaction. Include:</p>
            <ul className="ml-4 list-disc space-y-1 text-zinc-400">
              <li>the amount</li>
              <li>the category</li>
              <li>the date</li>
            </ul>
            <p className="mt-2 text-zinc-400">Example: “Paid 650 rupees for groceries on October 12th.”</p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-zinc-500">Voice input is not supported in this browser.</p>
        )}

        {transcript && (
          <div className="mb-4 rounded-xl border border-white/10 bg-surface-raised p-3 text-sm text-zinc-300">
            <p className="font-semibold text-white">Transcript</p>
            <p>{transcript}</p>
          </div>
        )}

        {voiceError && <p className="mb-4 text-sm text-red-400">{voiceError}</p>}

        {uploadedImage && (
          <div className="mb-6 rounded-xl border border-white/10 bg-surface-raised p-3">
            <div className="flex items-start justify-between">
              <img
                src={uploadedImage}
                alt="Receipt preview"
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="rounded-full p-1.5 text-zinc-400 transition hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {scannedData && (
              <div className="mt-2 space-y-1 text-xs text-zinc-400">
                <p>
                  <span className="text-zinc-300">Amount:</span> ₹{scannedData.amount}
                </p>
                <p>
                  <span className="text-zinc-300">Category:</span> {scannedData.category}
                </p>
                <p>
                  <span className="text-zinc-300">Date:</span> {scannedData.date}
                </p>
                {scannedData.merchant && (
                  <p>
                    <span className="text-zinc-300">Merchant:</span> {scannedData.merchant}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-raised p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Housing');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                type === 'expense'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ArrowDownCircle
                className={`h-5 w-5 ${type === 'expense' ? 'text-red-400' : ''}`}
              />
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition ${
                type === 'income'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ArrowUpCircle
                className={`h-5 w-5 ${type === 'income' ? 'text-emerald-400' : ''}`}
              />
              Income
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border-2 border-violet-500/50 bg-surface-raised py-4 pl-9 pr-4 text-2xl font-bold text-white outline-none focus:border-violet-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-raised px-3 py-3 text-sm text-white outline-none ring-violet-500/30 focus:border-violet-500/50 focus:ring-2"
              >
                {cats.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface-raised px-3 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What was this for?"
              className="w-full resize-none rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50 focus:ring-2"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
