import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Sparkles, FolderOpen, Menu, X, LogIn, LogOut, PlusCircle, Link as LinkIcon } from 'lucide-react';
import { NeonButton } from '../ui/NeonButton.js';
import { GlitchText } from '../ui/GlitchText.js';
import { useAuthStore } from '../../stores/auth.store.js';

interface GlassNavbarProps {
  onOpenCreateModal?: () => void;
  onOpenImportLinkModal?: () => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  onOpenCreateModal,
  onOpenImportLinkModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-strong border-b border-[#00f0ff]/20 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff2bd6] p-[1.5px] shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0a0b1e] rounded-[7px] flex items-center justify-center text-[#00f0ff]">
              <Sparkles className="w-5 h-5 text-[#00f0ff]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-orbitron font-extrabold text-lg text-white tracking-wider flex items-center gap-1">
              CAREERCRAFT
              <span className="text-[#00f0ff] text-xs font-mono">//AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-rajdhani font-semibold tracking-wider">
          <Link
            to="/templates"
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              isActive('/templates')
                ? 'text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-300 hover:text-[#00f0ff] hover:bg-white/5'
            }`}
          >
            TEMPLATES
          </Link>

          <Link
            to="/documents"
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              isActive('/documents')
                ? 'text-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-300 hover:text-[#00f0ff] hover:bg-white/5'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            MY DOCUMENTS
          </Link>

          {onOpenImportLinkModal && (
            <button
              onClick={onOpenImportLinkModal}
              className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-[#00f0ff] hover:bg-white/5 transition-all flex items-center gap-1.5 uppercase"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              IMPORT LINK
            </button>
          )}
        </nav>

        {/* Right Action CTA / User Profile */}
        <div className="hidden md:flex items-center gap-3">
          {onOpenCreateModal && (
            <NeonButton
              variant="secondary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={onOpenCreateModal}
            >
              CREATE NEW
            </NeonButton>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-300 bg-white/5 px-2.5 py-1 rounded border border-white/10">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <NeonButton variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  SIGN IN
                </NeonButton>
              </Link>
              <Link to="/signup">
                <NeonButton variant="primary" size="sm">
                  GET STARTED
                </NeonButton>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-[#00f0ff]"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-strong border-b border-[#00f0ff]/20 px-4 pt-3 pb-6 space-y-3 font-rajdhani text-base tracking-wider animate-in slide-in-from-top-2">
          <Link
            to="/templates"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:text-[#00f0ff] hover:bg-white/5"
          >
            TEMPLATES
          </Link>
          <Link
            to="/documents"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-200 hover:text-[#00f0ff] hover:bg-white/5"
          >
            MY DOCUMENTS
          </Link>
          {onOpenImportLinkModal && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenImportLinkModal();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:text-[#00f0ff] hover:bg-white/5 flex items-center gap-2 uppercase"
            >
              <LinkIcon className="w-4 h-4" />
              IMPORT VIA LINK
            </button>
          )}

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {onOpenCreateModal && (
              <NeonButton
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCreateModal();
                }}
                className="w-full justify-center"
              >
                CREATE NEW
              </NeonButton>
            )}

            {isAuthenticated ? (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  navigate('/');
                }}
                className="w-full py-2.5 rounded-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-center font-bold font-rajdhani flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> SIGN OUT
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <NeonButton variant="secondary" size="md" className="w-full justify-center">
                    SIGN IN
                  </NeonButton>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <NeonButton variant="primary" size="md" className="w-full justify-center">
                    REGISTER
                  </NeonButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
