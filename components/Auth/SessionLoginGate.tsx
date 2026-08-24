import React, { useState, type FormEvent } from 'react';
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { login, type AuthUser } from '@/lib/auth/session';

interface SessionLoginGateProps {
  user: AuthUser | null;
  checking: boolean;
  onAuthenticated: (user: AuthUser) => void;
}

export const SessionLoginGate: React.FC<SessionLoginGateProps> = ({ user, checking, onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const authenticatedUser = await login(username, password);
      setPassword('');
      onAuthenticated(authenticatedUser);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-950/95 px-4 py-6 text-slate-100 backdrop-blur-md"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60">
        <div className="relative border-b border-slate-800 px-6 py-6 text-center">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            {checking ? <Loader2 size={22} className="animate-spin" /> : <LockKeyhole size={22} />}
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">
            <ShieldCheck size={13} />
            NFFIS secure session
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            {checking ? 'Checking session' : 'Login required'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use your NFFIS username or e-mail address and password.
          </p>
        </div>

        {!checking && (
          <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="session-username">
                Username or e-mail
              </label>
              <input
                id="session-username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username or e-mail"
                className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="session-password">
                Password
              </label>
              <input
                id="session-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">
                {errorMessage}
              </p>
            )}

            <button
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
