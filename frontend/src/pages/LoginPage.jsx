import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  useEffect(() => {
    if (ready && isAuthenticated) navigate(from, { replace: true });
  }, [ready, isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-indigo-600/15 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto mb-3 h-12 w-12" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Lumina Finance
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-400">Sign in to access your Lumina workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-surface-raised px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          New to Lumina?{' '}
          <Link to="/register" className="font-medium text-violet-400 hover:text-violet-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
