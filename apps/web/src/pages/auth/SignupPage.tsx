import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupInput } from '@careercraft/shared';
import { authApi } from '../../api/auth.api.js';
import { Input } from '../../components/ui/Input.js';
import { Button } from '../../components/ui/Button.js';
import { PasswordStrength } from '../../components/ui/PasswordStrength.js';
import { FileText, MailCheck } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: SignupInput) => {
    setErrorMessage(null);
    try {
      const res = await authApi.signup(data);
      if (res.success && res.data) {
        setSuccessEmail(data.email);
      } else if (res.error) {
        setErrorMessage(res.error.message);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message || 'Registration failed. Please try again.'
      );
    }
  };

  if (successEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <MailCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Check Your Email</h2>
          <p className="text-sm text-slate-600">
            We sent a verification link to <span className="font-semibold text-slate-800">{successEmail}</span>.
            Click the link in the email to activate your account.
          </p>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Proceed to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500">
            Get started building stunning, recruiter-ready resumes in minutes.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <PasswordStrength password={passwordValue} />
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
