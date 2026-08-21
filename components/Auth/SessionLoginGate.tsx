import React, { useEffect, useState, type FormEvent } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { fetchCurrentUser, login } from '@/lib/auth/session';
import { AUTH_INVALIDATED_EVENT, ApiError } from '@/services/api';

export const SessionLoginGate: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const user = await fetchCurrentUser();
        if (active) setIsAuthenticated(Boolean(user));
      } catch {
        if (active) setErrorMessage('Unable to connect to the NFFIS backend.');
      } finally {
        if (active) setIsChecking(false);
      }
    };

    const invalidate = () => setIsAuthenticated(false);
    window.addEventListener(AUTH_INVALIDATED_EVENT, invalidate);
    void checkSession();

    return () => {
      active = false;
      window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidate);
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(username, password);
      setPassword('');
      setIsAuthenticated(true);
    } catch (error) {
      setPassword('');
      setErrorMessage(error instanceof ApiError ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div aria-modal="true" role="dialog" className="fixed inset-0 z-[9000] flex items-center justify-center bg-slate-950/95 px-4 py-6 text-slate-100 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60">
        <div className="relative border-b border-slate-800 px-6 py-6 text-center">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/15 text-blue-400 ring-1 ring-blue-500/30">
            <LockKeyhole size={22} />
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-blue-400">
            <ShieldCheck size={13} />
            NFFIS secure session
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Session login required</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isChecking ? 'Checking your secure session...' : 'Enter your NFFIS credentials to continue.'}
          </p>
        </div>

        {isChecking ? (
          <div className="px-6 py-8 text-center text-sm font-semibold text-slate-500">Connecting...</div>
        ) : (
          <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="session-username">Username or email</label>
              <input id="session-username" autoComplete="username" autoFocus value={username} onChange={(event) => setUsername(event.target.value)} required className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500" htmlFor="session-password">Password</label>
              <input id="session-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            </div>

            {errorMessage ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300">{errorMessage}</p> : null}

            <button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-950/30 transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:bg-slate-700" type="submit" disabled={isSubmitting}>
              <LockKeyhole size={17} />
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
