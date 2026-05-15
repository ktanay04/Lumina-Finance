import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ProfileModal from './ProfileModal';

const VARIANT_BORDER = {
  info: 'border-l-violet-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-rose-500',
};

export default function TopBar() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifWrapRef = useRef(null);
  const prevNotifOpen = useRef(false);

  useEffect(() => {
    if (prevNotifOpen.current && !notifOpen) {
      markAllRead();
    }
    prevNotifOpen.current = notifOpen;
  }, [notifOpen, markAllRead]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const onPointerDown = (e) => {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notifOpen]);

  const toggleNotifications = () => {
    setNotifOpen((prev) => !prev);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="flex items-center justify-end gap-4 border-b border-white/5 bg-surface/80 px-8 py-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="relative" ref={notifWrapRef}>
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && !notifOpen ? (
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0a]"
                aria-hidden
              />
            ) : null}
          </button>
          {notifOpen ? (
            <div
              id="notification-panel"
              className="absolute right-0 top-full z-[220] mt-2 w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-xl border border-white/10 bg-surface-card shadow-2xl ring-1 ring-black/40"
              role="region"
              aria-label="Notifications list"
            >
              <div className="border-b border-white/5 px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Notifications
                </p>
              </div>
              <ul className="max-h-80 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-zinc-500">
                    No notifications yet.
                  </li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`border-b border-white/5 border-l-4 px-4 py-3 last:border-b-0 ${
                        VARIANT_BORDER[n.variant] || VARIANT_BORDER.info
                      } ${n.read ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{n.message}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-600">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          aria-label="Open profile"
        >
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-white">
              {user?.name || 'User'}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
            {initial}
          </div>
        </button>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
