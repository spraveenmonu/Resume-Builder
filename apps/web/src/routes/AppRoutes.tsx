import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.js';
import { AdminRoute } from './AdminRoute.js';
import { Loader2 } from 'lucide-react';

// Code-split routes for optimal performance
const LandingPage = lazy(() =>
  import('../pages/LandingPage.js').then((m) => ({ default: m.LandingPage }))
);
const TemplatesPage = lazy(() =>
  import('../pages/TemplatesPage.js').then((m) => ({ default: m.TemplatesPage }))
);
const DocumentsPage = lazy(() =>
  import('../pages/DocumentsPage.js').then((m) => ({ default: m.DocumentsPage }))
);
const EditorPage = lazy(() =>
  import('../pages/EditorPage.js').then((m) => ({ default: m.EditorPage }))
);
const ImportSharePage = lazy(() =>
  import('../pages/ImportSharePage.js').then((m) => ({ default: m.ImportSharePage }))
);
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage.js').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('../pages/auth/SignupPage.js').then((m) => ({ default: m.SignupPage }))
);
const VerifyEmailPage = lazy(() =>
  import('../pages/auth/VerifyEmailPage.js').then((m) => ({ default: m.VerifyEmailPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/auth/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('../pages/auth/ResetPasswordPage.js').then((m) => ({ default: m.ResetPasswordPage }))
);
const SettingsPage = lazy(() =>
  import('../pages/settings/SettingsPage.js').then((m) => ({ default: m.SettingsPage }))
);

const PageFallback: React.FC = () => (
  <div className="min-h-dvh flex flex-col items-center justify-center bg-[#05060f] gap-3">
    <Loader2 className="w-9 h-9 text-[#00f0ff] animate-spin drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]" />
    <span className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase animate-pulse">
      // LOADING PROTOCOL...
    </span>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public Landing & Showcase */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/import/:shareToken" element={<ImportSharePage />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/dashboard" element={<DocumentsPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:id" element={<EditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
