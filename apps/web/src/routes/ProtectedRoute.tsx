import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store.js';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#05060f] gap-3">
        <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]" />
        <span className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase animate-pulse">
          // VERIFYING NEURAL ACCESS...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
