import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, Download, ArrowRight, Loader2, ShieldCheck, ShieldAlert, LogIn } from 'lucide-react';
import { GlassNavbar } from '../components/layout/GlassNavbar.js';
import { GlassBackground } from '../components/ui/GlassBackground.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { NeonButton } from '../components/ui/NeonButton.js';
import { ResumeRenderer } from '../templates/ResumeRenderer.js';
import { CoverLetterRenderer } from '../templates/CoverLetterRenderer.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase/supabaseClient.js';
import { useAuthStore } from '../stores/auth.store.js';
import { useDocumentStore } from '../stores/document.store.js';
import { useUiStore } from '../stores/ui.store.js';

export const ImportSharePage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { createNewDocument } = useDocumentStore();
  const { addToast } = useUiStore();

  const [documentData, setDocumentData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const fetchShared = async () => {
      if (!shareToken) return;
      setIsLoading(true);
      setErrorMessage(null);

      // 1. Try Supabase Security Definer RPC
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.rpc('get_shared_document', {
            token: shareToken,
          });

          if (!error && data && data.length > 0) {
            setDocumentData(data[0]);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase RPC note:', e);
        }
      }

      // 2. Fallback check local storage for demo/offline link preview
      try {
        const raw = localStorage.getItem('careercraft_local_documents');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((d: any) => d.share_token === shareToken && d.is_shared);
          if (found) {
            setDocumentData(found);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Local fallback error:', e);
      }

      setErrorMessage('This shared document link is invalid, expired, or has been revoked by the owner.');
      setIsLoading(false);
    };

    fetchShared();
  }, [shareToken]);

  const handleImportToAccount = async () => {
    if (!documentData) return;

    if (!isAuthenticated) {
      addToast('info', 'Please sign in or create an account to import this document.');
      navigate('/login', { state: { from: { pathname: `/import/${shareToken}` } } });
      return;
    }

    setIsImporting(true);
    try {
      const doc = createNewDocument(
        documentData.type,
        documentData.template_id,
        `${documentData.title} (Imported)`
      );
      // Populate with shared content & styles
      doc.content = JSON.parse(JSON.stringify(documentData.content));
      doc.styles = JSON.parse(JSON.stringify(documentData.styles));
      
      addToast('success', `Imported "${doc.title}" to your account!`);
      navigate(`/editor/${doc.id}`);
    } catch {
      addToast('error', 'Could not import document.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-hidden">
      <GlassBackground />
      <GlassNavbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex flex-col items-center">
        {isLoading ? (
          <div className="my-auto flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin" />
            <span className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase">
              // RETRIEVING SECURE BLUEPRINT...
            </span>
          </div>
        ) : errorMessage ? (
          <div className="my-auto max-w-md w-full glass p-8 rounded-2xl border border-rose-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-orbitron text-white">ACCESS REVOKED OR EXPIRED</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              {errorMessage}
            </p>
            <Link to="/templates">
              <NeonButton variant="secondary" size="md" className="w-full justify-center">
                EXPLORE TEMPLATES →
              </NeonButton>
            </Link>
          </div>
        ) : (
          <div className="w-full space-y-6">
            {/* Header Action Banner */}
            <div className="glass-panel p-4 rounded-2xl border border-[#00f0ff]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-widest block">
                  // PUBLIC PREVIEW
                </span>
                <h1 className="text-xl font-bold font-orbitron text-white">
                  {documentData.title}
                </h1>
                <p className="text-xs text-slate-400">
                  Format: {documentData.type === 'resume' ? 'Resume / CV' : 'Cover Letter'} · Blueprint: {documentData.template_id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <NeonButton
                  variant="primary"
                  size="md"
                  chamfer
                  isLoading={isImporting}
                  onClick={handleImportToAccount}
                  leftIcon={isAuthenticated ? <Sparkles className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                >
                  {isAuthenticated ? 'CLONE & EDIT IN MY VAULT' : 'SIGN IN TO IMPORT'}
                </NeonButton>
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="w-full flex justify-center overflow-x-auto py-6">
              <div className="shadow-2xl">
                {documentData.type === 'resume' ? (
                  <ResumeRenderer
                    content={documentData.content}
                    styles={documentData.styles}
                    templateId={documentData.template_id}
                  />
                ) : (
                  <CoverLetterRenderer
                    content={documentData.content}
                    styles={documentData.styles}
                    templateId={documentData.template_id}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
