import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail(token)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage(res.data?.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(res.error?.message || 'Verification link expired or invalid.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error?.message || 'Verification failed.');
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await authApi.resendVerification(resendEmail);
      setResendStatus(res.data?.message || 'Verification link sent if account exists.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.error?.message || 'Failed to resend verification.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        {status === 'loading' && (
          <div className="space-y-4 py-8">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Verifying your email...</h2>
            <p className="text-sm text-slate-500">Please wait while we confirm your account token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Email Verified!</h2>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Sign In to Your Account
                </Button>
              </Link>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="space-y-4">
            {status === 'error' && (
              <>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-2">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Verification Link Invalid</h2>
                <p className="text-sm text-slate-600">{message}</p>
              </>
            )}

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Resend Verification Link
              </h3>
              <form onSubmit={handleResend} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="secondary" size="sm" className="w-full" isLoading={isResending}>
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Send New Link
                </Button>
              </form>
              {resendStatus && (
                <p className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                  {resendStatus}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Link to="/login" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
