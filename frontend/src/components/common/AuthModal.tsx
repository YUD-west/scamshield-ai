import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { apiService, ApiError } from '../../services/api';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await apiService.register({
          username: username.trim(),
          password,
          email: email.trim() || undefined,
        });
        setSuccessMsg(`Welcome, ${res.user.username}! Your vault is now encrypted and active.`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 1000);
      } else {
        const res = await apiService.login({
          username_or_email: username.trim(),
          password,
        });
        setSuccessMsg(`Welcome back, ${res.user.username}!`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not complete request. Please verify your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-char/80 p-4 backdrop-blur-xs animate-fade"
    >
      <div className="relative w-full max-w-md rounded-md border border-line bg-surface p-6 shadow-2xl space-y-5 animate-rise">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <div className="label !text-amber-700">Account & Synchronization</div>
            <h2 className="display text-[28px] mt-1 text-fg">
              {mode === 'login' ? 'Sign in to your vault' : 'Create private account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-fg4 hover:text-fg transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-sm border border-line bg-page p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-mono font-bold uppercase tracking-wider transition rounded-xs cursor-pointer ${
              mode === 'login'
                ? 'bg-char text-bone shadow-xs'
                : 'text-fg3 hover:text-fg'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-mono font-bold uppercase tracking-wider transition rounded-xs cursor-pointer ${
              mode === 'register'
                ? 'bg-char text-bone shadow-xs'
                : 'text-fg3 hover:text-fg'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Reassurance Banner for Non-Technical Users */}
        <div className="rounded-sm border border-line bg-page p-3 text-xs leading-relaxed text-fg3 font-sans">
          <strong>Free & Open:</strong> You can check messages for scams anytime without an account. An account simply keeps your sealed incident reports backed up across devices.
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="rounded-sm border border-rust/40 bg-rust/10 p-3 text-xs text-rust font-medium"
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-sm border border-sage/40 bg-sage/10 p-3 text-xs text-sage font-medium"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label block mb-1">
              {mode === 'login' ? 'Username or Email' : 'Choose a Username'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-fg4" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'e.g. sarah_connor' : 'e.g. alex2026'}
                className="w-full rounded-sm border border-line bg-page pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg4 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="label block mb-1">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-fg4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-sm border border-line bg-page pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg4 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label block mb-1">
              {mode === 'login' ? 'Password' : 'Create a Password (min. 6 characters)'}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-fg4" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-sm border border-line bg-page pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg4 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-amber-400 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-char hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'login' ? (
              <span>Sign In to Vault</span>
            ) : (
              <span>Create Free Account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
