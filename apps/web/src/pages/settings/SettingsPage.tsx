import React, { useEffect, useState, useRef } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUiStore } from '../../stores/ui.store.js';
import { userApi } from '../../api/user.api.js';
import { authApi } from '../../api/auth.api.js';
import { SessionDto, OAuthAccountDto } from '@careercraft/shared';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { PasswordStrength } from '../../components/ui/PasswordStrength.js';
import {
  User,
  Shield,
  Key,
  Mail,
  Camera,
  Trash2,
  Download,
  AlertTriangle,
  Smartphone,
  LogOut,
  Laptop,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Sessions & OAuth
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [oauthAccounts, setOauthAccounts] = useState<OAuthAccountDto[]>([]);

  // 2FA Setup
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // 2FA Disable
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  // Delete Account
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
    loadSessions();
    loadOAuthAccounts();
  }, [user]);

  const loadSessions = async () => {
    try {
      const res = await userApi.getSessions();
      if (res.success && res.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch {
      // Ignored
    }
  };

  const loadOAuthAccounts = async () => {
    try {
      const res = await userApi.getOAuthAccounts();
      if (res.success && res.data?.accounts) {
        setOauthAccounts(res.data.accounts);
      }
    } catch {
      // Ignored
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await userApi.updateProfile({ name });
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        addToast('success', 'Profile name updated successfully.');
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to update name.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await userApi.uploadAvatar(file);
      if (res.success && res.data?.avatarUrl) {
        if (user) setUser({ ...user, avatarUrl: res.data.avatarUrl });
        addToast('success', 'Avatar uploaded and optimized successfully.');
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to upload photo.');
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await userApi.deleteAvatar();
      if (user) setUser({ ...user, avatarUrl: null });
      addToast('success', 'Profile photo removed.');
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to delete photo.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      const res = await userApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        addToast('success', res.data?.message || 'Password updated.');
        loadSessions();
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingEmail(true);
    try {
      const res = await userApi.changeEmail({ newEmail, password: emailPassword });
      if (res.success) {
        setNewEmail('');
        setEmailPassword('');
        addToast('info', res.data?.message || 'Verification link sent to new email.');
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to request email change.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleStart2FA = async () => {
    try {
      const res = await authApi.setup2FA();
      if (res.success && res.data) {
        setTwoFactorData(res.data);
        setIs2FAModalOpen(true);
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to initialize 2FA.');
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying2FA(true);
    try {
      const res = await authApi.verify2FA(totpCode);
      if (res.success && res.data) {
        setBackupCodes(res.data.backupCodes);
        if (user) setUser({ ...user, totpEnabled: true });
        addToast('success', 'Two-Factor Authentication is now active!');
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Invalid verification code.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisabling2FA(true);
    try {
      const res = await authApi.disable2FA(disablePassword, disableCode);
      if (res.success) {
        setIsDisable2FAModalOpen(false);
        setDisablePassword('');
        setDisableCode('');
        if (user) setUser({ ...user, totpEnabled: false });
        addToast('success', 'Two-Factor Authentication disabled.');
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to disable 2FA.');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await userApi.revokeSession(id);
      addToast('success', 'Session signed out.');
      loadSessions();
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to revoke session.');
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await userApi.exportData();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `careercraft-user-data-${user?.id || 'export'}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      addToast('success', 'Personal data exported successfully.');
    } catch {
      addToast('error', 'Failed to export data.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeletingAccount(true);
    try {
      const res = await userApi.deleteAccount({
        emailConfirmation: deleteEmailConfirm,
        password: deletePassword,
      });
      if (res.success) {
        addToast('info', res.data?.message || 'Account scheduled for deletion.');
        window.location.href = '/login';
      }
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-500">
            Manage your personal profile, security preferences, and active sessions.
          </p>
        </div>

        {/* 1. Profile & Avatar */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Profile Information</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Upload photo"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-sm font-semibold text-slate-800">Profile Photo</h3>
              <p className="text-xs text-slate-500">
                Max 5 MB (JPG, PNG, or WebP). Automatically cropped & optimized to 800px.
              </p>
              <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Upload Photo
                </Button>
                {user?.avatarUrl && (
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={handleDeleteAvatar}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateName} className="space-y-4 max-w-md pt-2">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
              Save Profile Changes
            </Button>
          </form>
        </section>

        {/* 2. Security: Change Password & 2FA */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Security & Authentication</h2>
          </div>

          {/* Two-Factor Authentication Toggle */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Two-Factor Authentication (TOTP)
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Secure your account with authenticator apps (Google Authenticator, 1Password, Authy).
              </p>
            </div>
            <div>
              {user?.totpEnabled ? (
                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200" onClick={() => setIsDisable2FAModalOpen(true)}>
                  Disable 2FA
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={handleStart2FA}>
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {/* Change Password Form */}
          <div className="space-y-4 max-w-md pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Key className="w-4 h-4" /> Change Password
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <div className="space-y-1">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <PasswordStrength password={newPassword} />
              </div>
              <Button type="submit" size="sm" isLoading={isUpdatingPassword}>
                Update Password
              </Button>
            </form>
          </div>

          {/* Change Email Form */}
          <div className="space-y-4 max-w-md pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Mail className="w-4 h-4" /> Change Registered Email
            </div>
            <p className="text-xs text-slate-500">
              Current email: <span className="font-semibold text-slate-700">{user?.email}</span>
            </p>
            <form onSubmit={handleChangeEmail} className="space-y-3">
              <Input
                label="New Email Address"
                type="email"
                placeholder="new.email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Input
                label="Confirm Current Password"
                type="password"
                placeholder="••••••••"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
              />
              <Button type="submit" size="sm" isLoading={isUpdatingEmail}>
                Send Email Verification Link
              </Button>
            </form>
          </div>
        </section>

        {/* 3. Active Sessions */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-800">Active Login Sessions</h2>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {s.userAgent || 'Unknown Device / Browser'}{' '}
                    {s.isCurrent && (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                        Current Session
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    IP: {s.ipAddress || 'unknown'} • Last active {new Date(s.lastActiveAt).toLocaleString()}
                  </p>
                </div>
                {!s.isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-rose-600 hover:bg-rose-50"
                    onClick={() => handleRevokeSession(s.id)}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. Data Privacy & Account Deletion */}
        <section className="p-6 bg-white rounded-2xl border border-rose-200/60 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-rose-100">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-800">Data Privacy & Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Export Personal Data</h4>
              <p className="text-xs text-slate-500">
                Download a complete JSON backup containing all resumes, letters, job tracker records, and styles.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportData}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download My Data (JSON)
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">Delete Account</h4>
              <p className="text-xs text-slate-500">
                Soft-deletes your account with a 7-day grace period. After 7 days, all data is permanently purged.
              </p>
            </div>
            <Button size="sm" variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              Delete Account
            </Button>
          </div>
        </section>
      </div>

      {/* 2FA Setup Modal */}
      <Modal isOpen={is2FAModalOpen} onClose={() => setIs2FAModalOpen(false)} title="Set Up Two-Factor Authentication">
        {backupCodes ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Save these 10 one-time backup codes in a secure place. If you lose access to your authenticator device, you can use these to log in:
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 text-center">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-1 bg-white rounded border border-slate-200">{code}</div>
              ))}
            </div>
            <Button className="w-full" onClick={() => { setIs2FAModalOpen(false); setBackupCodes(null); }}>
              I Have Saved My Backup Codes
            </Button>
          </div>
        ) : twoFactorData ? (
          <form onSubmit={handleConfirm2FA} className="space-y-4 text-center">
            <p className="text-xs text-slate-600 text-left">
              1. Scan this QR code in Google Authenticator, 1Password, or Authy:
            </p>
            <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
              <img src={twoFactorData.qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 mx-auto" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Manual key: {twoFactorData.secret}</p>
            <div className="text-left space-y-1">
              <Input
                label="2. Enter the 6-Digit Code Generated by the App"
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" isLoading={isVerifying2FA}>
              Verify & Activate 2FA
            </Button>
          </form>
        ) : null}
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal isOpen={isDisable2FAModalOpen} onClose={() => setIsDisable2FAModalOpen(false)} title="Disable Two-Factor Authentication">
        <form onSubmit={handleDisable2FA} className="space-y-4">
          <p className="text-xs text-slate-600">
            For security, please enter your account password and a current 6-digit TOTP code or backup code:
          </p>
          <Input
            label="Account Password"
            type="password"
            placeholder="••••••••"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            required
          />
          <Input
            label="TOTP or Backup Code"
            placeholder="123456"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            required
          />
          <Button type="submit" variant="danger" className="w-full" isLoading={isDisabling2FA}>
            Confirm Disable 2FA
          </Button>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Your Account">
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            Warning: This action will deactivate your account. You will have 7 days to cancel before all your resumes, cover letters, and applications are permanently destroyed.
          </div>
          <Input
            label={`Type your email "${user?.email}" to confirm`}
            type="email"
            value={deleteEmailConfirm}
            onChange={(e) => setDeleteEmailConfirm(e.target.value)}
            required
          />
          <Input
            label="Account Password"
            type="password"
            placeholder="••••••••"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
          />
          <Button type="submit" variant="danger" className="w-full" isLoading={isDeletingAccount}>
            Permanently Schedule Account Deletion
          </Button>
        </form>
      </Modal>
    </DashboardShell>
  );
};
