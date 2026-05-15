import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;
function nextId() {
  toastId += 1;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast_${Date.now()}_${toastId}`;
}

const VARIANTS = {
  info: {
    border: 'border-violet-500/40',
    bg: 'bg-zinc-900/95',
    icon: Info,
    iconClass: 'text-violet-400',
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'bg-zinc-900/95',
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
  },
  danger: {
    border: 'border-rose-500/50',
    bg: 'bg-zinc-900/95',
    icon: AlertCircle,
    iconClass: 'text-rose-400',
  },
};

function ToastCard({ toast, onDismiss }) {
  const cfg = VARIANTS[toast.variant] || VARIANTS.info;
  const Icon = cfg.icon;
  return (
    <div
      role="status"
      className={`pointer-events-auto flex gap-3 rounded-xl border p-4 shadow-2xl ring-1 ring-black/40 ${cfg.border} ${cfg.bg}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        <p className="mt-1 text-sm text-zinc-300">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = 'info' }) => {
      const id = nextId();
      const toast = { id, title, message, variant };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => dismiss(id), 9000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[250] flex w-[min(100%-2rem,22rem)] flex-col gap-2 sm:right-6 sm:top-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
