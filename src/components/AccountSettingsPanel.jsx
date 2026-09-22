import React, { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Shared between PatronDashboardView and AdminView — every signed-in
// account, patron or admin, is the same profiles row shape and deserves
// the same ability to update their own name and password, not just
// whichever one this was built for first.
export default function AccountSettingsPanel() {
  const { user, profile, retryProfile, updatePassword } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSaved(false);
    if (!fullName.trim()) {
      setNameError('Full name cannot be empty.');
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);
      if (error) {
        setNameError(error.message);
        return;
      }
      // Refetches into the shared AuthContext state so "Signed in as..."
      // and anywhere else profile.full_name is read update immediately,
      // not just this form's own local state.
      retryProfile();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (err) {
      setNameError(err?.message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setSavingName(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordError(err?.message || 'Something went wrong. Check your connection and try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <form
        onSubmit={handleSaveName}
        className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-serif text-lg text-on-surface">Profile</h3>
          {/* Email isn't editable here on purpose — changing it needs
              Supabase's own confirmation flow on the auth.users record,
              not a direct write to this denormalized profiles copy, and
              that flow isn't built yet. Pointing to email support instead
              of silently doing nothing or half-implementing it. */}
          <p className="text-xs text-on-surface-variant mt-1">
            Signed in as {user?.email}. To change your email, contact{' '}
            <a href="mailto:acuavibe@gmail.com" className="text-accent hover:text-terracota transition-colors">
              acuavibe@gmail.com
            </a>
            .
          </p>
        </div>
        <div>
          <label htmlFor="settings-full-name" className="text-xs font-medium text-on-surface mb-1.5 block">
            Full Name
          </label>
          <input
            id="settings-full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="cloud-input"
          />
        </div>
        {nameError && (
          <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{nameError}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingName} className="btn-terracotta">
            {savingName ? 'Saving…' : 'Save Name'}
          </button>
          {nameSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>
      </form>

      <form
        onSubmit={handleSavePassword}
        className="bg-surface-elevated rounded-2xl shadow-cloud-sm p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="font-serif text-lg text-on-surface">Change Password</h3>
          <p className="text-xs text-on-surface-variant mt-1">Choose a new password for signing in.</p>
        </div>
        <div>
          <label htmlFor="settings-new-password" className="text-xs font-medium text-on-surface mb-1.5 block">
            New Password
          </label>
          <input
            id="settings-new-password"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="cloud-input"
          />
        </div>
        <div>
          <label htmlFor="settings-confirm-password" className="text-xs font-medium text-on-surface mb-1.5 block">
            Confirm New Password
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="cloud-input"
          />
        </div>
        {passwordError && (
          <div className="flex items-start gap-2 text-xs text-accent bg-chile-rojo/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingPassword} className="btn-terracotta">
            {savingPassword ? 'Saving…' : 'Update Password'}
          </button>
          {passwordSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive">
              <Check className="w-3.5 h-3.5" /> Updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
