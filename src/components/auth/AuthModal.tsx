import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await register(name, email, phone, password);
      if (res.success) {
        setPassword('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Unable to register account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-8 space-y-5 sm:space-y-6 border border-stone-200 relative text-xs"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-900 mx-auto mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                {mode === 'login' ? 'Sign In to ThreadCraft' : 'Create Customer Account'}
              </h2>
              <p className="text-stone-500 text-[11px]">
                {mode === 'login'
                  ? 'Sign in with your registered email and password to access your account.'
                  : 'Register today and receive 100 welcome loyalty points.'}
              </p>
            </div>

            {/* Error notification */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-stone-950 text-white rounded-md font-bold text-xs hover:bg-stone-800 transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+8801XXXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Password (minimum 8 characters) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-xs outline-none focus:border-stone-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-stone-950 text-white rounded-md font-bold text-xs hover:bg-stone-800 transition-colors shadow-2xs mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Creating Account...' : 'Create Account (+100 Pts)'}</span>
                </button>
              </form>
            )}

            {/* Switch mode */}
            <div className="pt-2 text-center text-stone-600">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-stone-950 font-bold underline underline-offset-2"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="text-stone-950 font-bold underline underline-offset-2"
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
