import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'photo', label: 'Profile photo' },
];

export default function ProfileModal({ open, onClose }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [photoPreview, setPhotoPreview] = useState(user?.photo || '');
  const [photoError, setPhotoError] = useState('');
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setPhotoPreview(user?.photo || '');
    setPhotoError('');
    setActiveTab('profile');
  }, [open, user?.photo]);

  if (!open) return null;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoFileChange = (file) => {
    if (!file) {
      setPhotoPreview(user?.photo || '');
      setPhotoError('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setPhotoError('');
    };
    reader.onerror = () => {
      setPhotoError('Unable to read the selected image');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoInput = (e) => {
    const file = e.target.files?.[0];
    handlePhotoFileChange(file);
  };

  const handleSavePhoto = async (e) => {
    e.preventDefault();
    setPhotoError('');
    if (!photoPreview) {
      setPhotoError('Select a photo first');
      return;
    }
    setPhotoSaving(true);
    try {
      updateUser({ photo: photoPreview });
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    updateUser({ photo: null });
  };

  const togglePhotoViewer = () => {
    setPhotoViewerOpen((current) => !current);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex min-h-dvh w-full items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="presentation"
      aria-hidden={false}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="relative max-h-[min(90dvh,36rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-surface-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="profile-modal-title" className="text-xl font-bold text-white">
            Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-white text-slate-950'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Name
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Username (email)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400"
                />
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-white">Change password</h3>
              <p className="mt-1 text-xs text-zinc-500">
                After a successful change you will be signed out and need to log in again.
              </p>
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Current password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    required
                    minLength={6}
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {loading ? 'Updating…' : 'Change password'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-center">
              <button
                type="button"
                onClick={photoPreview ? togglePhotoViewer : undefined}
                className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-violet-600 text-3xl font-bold text-white transition hover:ring-2 hover:ring-violet-500/60"
                aria-label={photoPreview ? 'View photo preview' : undefined}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </button>
              <p className="text-sm text-zinc-400">
                Choose a profile photo that will be stored locally in your browser.
              </p>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Upload photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoInput}
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white file:rounded-xl file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {photoError && <p className="text-sm text-red-400">{photoError}</p>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={photoSaving}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {photoSaving ? 'Saving…' : 'Save photo'}
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                >
                  Remove photo
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      {photoViewerOpen && photoPreview ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={togglePhotoViewer}
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl border border-white/10 bg-surface-card p-3">
            <img
              src={photoPreview}
              alt="Full photo preview"
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
