import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupInput } from '@careercraft/shared';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/supabaseClient.js';
import { authApi } from '../../api/auth.api.js';
import { useAuthStore } from '../../stores/auth.store.js';
import { useUiStore } from '../../stores/ui.store.js';
import { GlassBackground } from '../../components/ui/GlassBackground.js';
import { GlassCard } from '../../components/ui/GlassCard.js';
import { GlassInput } from '../../components/ui/GlassInput.js';
import { NeonButton } from '../../components/ui/NeonButton.js';
import { Sparkles, MailCheck, ShieldAlert } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { addToast } = useUiStore();
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setErrorMessage(null);

    // 1. Supabase Auth registration
    if (isSupabaseConfigured) {
      try {
        const { data: supaData, error: supaErr } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { name: data.name },
          },
        });

        if (!supaErr && supaData?.user) {
          if (supaData.session) {
            setUser({
              id: supaData.user.id,
              email: supaData.user.email || '',
              name: data.name,
              role: 'USER',
              isEmailVerified: true,
              avatarUrl: null,
              totpEnabled: false,
              createdAt: new Date().toISOString(),
            });
            addToast('success', `ACCOUNT CREATED: Welcome aboard, ${data.name}!`);
            navigate('/templates');
            return;
          } else {
            setSuccessEmail(data.email);
            return;
          }
        } else if (supaErr && !supaErr.message.includes('FetchError')) {
          console.warn('Supabase signup notice:', supaErr.message);
        }
      } catch (err) {
        console.warn('Supabase signup error:', err);
      }
    }

    // 2. Fallback to API Client
    try {
      const res = await authApi.signup(data);
      if (res.success && res.data) {
        setSuccessEmail(data.email);
      } else if (res.error) {
        setErrorMessage(res.error.message);
      }
    } catch {
      // Local/Demo Mode registration fallback
      setUser({
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name,
        role: 'USER',
        isEmailVerified: true,
        avatarUrl: null,
        totpEnabled: false,
        createdAt: new Date().toISOString(),
      });
      addToast('success', 'LOCAL IDENTITY INITIALIZED: Welcome to CareerCraft.');
      navigate('/templates');
    }
  };

  if (successEmail) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
        <GlassBackground />
        <GlassCard
          variant="cyan"
          hudCorners
          className="w-full max-w-md p-8 glass-strong border border-[#00f0ff]/40 text-center space-y-4"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] mb-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <MailCheck className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#00f0ff] uppercase block">
            // DISPATCH TRANSMITTED
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white">CHECK YOUR COMM FREQUENCY</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            We sent a verification link to <span className="font-mono text-[#00f0ff]">{successEmail}</span>.
            Authorize the link to initiate full access.
          </p>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <Link to="/login">
              <NeonButton variant="primary" size="md" className="w-full justify-center">
                PROCEED TO LOGIN →
              </NeonButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden">
      <GlassBackground />

      <GlassCard
        variant="pink"
        hudCorners
        className="w-full max-w-md p-8 relative z-10 glass-strong border border-[#ff2bd6]/30 rounded-2xl shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ff2bd6] to-[#00f0ff] p-[2px] shadow-neon-pink mb-2">
            <div className="w-full h-full bg-[#0a0b1e] rounded-[10px] flex items-center justify-center text-[#ff2bd6]">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-[#ff2bd6] uppercase block">
            // NEW OPERATIVE REGISTRATION
          </span>
          <h1 className="text-2xl font-bold font-orbitron text-white tracking-wide">
            CREATE YOUR ACCOUNT
          </h1>
          <p className="text-xs text-slate-400">
            Build ATS-compliant resumes with Canva-grade design tokens.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>[ERROR] {errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <GlassInput
            terminalLabel="FULL NAME"
            placeholder="Jane Doe"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />

          <GlassInput
            terminalLabel="OPERATIVE EMAIL"
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <GlassInput
            terminalLabel="CHOOSE ACCESS KEY"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <NeonButton
            type="submit"
            variant="primary"
            size="md"
            chamfer
            isLoading={isSubmitting}
            className="w-full justify-center mt-2"
          >
            INITIALIZE OPERATIVE &gt;&gt;
          </NeonButton>
        </form>

        <p className="text-center text-xs text-slate-400 font-mono">
          ALREADY REGISTERED?{' '}
          <Link to="/login" className="text-[#00f0ff] hover:underline font-bold">
            SIGN IN →
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};
