import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@careercraft/shared';
import { authApi } from '../../api/auth.api.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { PasswordStrength } from '../../components/ui/PasswordStrength.js';
import { Lock, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (data: ResetPasswordInput) => {
    setErrorMessage(null);
    try {
      const res = await authApi.resetPassword({ token, newPassword: data.newPassword });
      if (res.success) {
        setIsSuccess(true);
      } else if (res.error) {
        setErrorMessage(res.error.message);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message || 'Password reset failed. Link may be expired.'
      );
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Missing Reset Token</h2>
          <p className="text-xs text-slate-600">
            Please use the full link provided in your password reset email.
          </p>
          <Link to="/forgot-password">
            <Button variant="primary" className="w-full">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set New Password</h1>
          <p className="text-sm text-slate-500">
            Create a strong, unique password to secure your account.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
            {errorMessage}
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Password Reset Complete!</h2>
            <p className="text-xs text-slate-600">
              All previous sessions have been signed out. You can now log in with your new password.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Sign In Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" value={token} {...register('token')} />

            <div className="space-y-1">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />
              <PasswordStrength password={newPasswordValue} />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
