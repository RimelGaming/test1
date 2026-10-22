import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const ForcePasswordChangeModal: React.FC = () => {
  const { currentUser, changePassword, logout } = useStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser || !currentUser.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.success) {
        setError(result.error || 'Failed to update password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 text-xs"
      >
        <div className="flex items-start gap-3 pb-3 border-b border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider rounded mb-1">
              Mandatory Security Action
            </span>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Update Temporary Password
            </h2>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
              Your account (<span className="font-semibold text-stone-800">{currentUser.email}</span>) was provisioned with a temporary password. You must set a new secure password before accessing protected administrator tools.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Current Temporary Password *
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter current temporary password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              New Password (minimum 8 characters) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Enter new strong password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Confirm New Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-stone-900"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{submitting ? 'Updating Password...' : 'Update Password & Continue'}</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto py-2.5 px-4 border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
