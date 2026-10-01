import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { z } from 'zod';
import { Link as LinkIcon, Loader2, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { GlassModal } from '../ui/GlassModal.js';
import { GlassInput } from '../ui/GlassInput.js';
import { NeonButton } from '../ui/NeonButton.js';
import { useDocumentStore } from '../../stores/document.store.js';
import { useUiStore } from '../../stores/ui.store.js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/supabaseClient.js';

export interface ImportLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const templateJsonSchema = z.object({
  type: z.enum(['resume', 'cover_letter']).default('resume'),
  title: z.string().default('Imported Document'),
  template_id: z.string().default('michael'),
  content: z.record(z.any()).default({}),
  styles: z.record(z.any()).default({}),
});

export const ImportLinkModal: React.FC<ImportLinkModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const { createNewDocument } = useDocumentStore();

  const [inputUrl, setInputUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleValidate = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMessage('Please provide a valid URL or share link.');
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    setPreviewData(null);

    try {
      // Case 1: Internal App Share Link e.g. /import/:token or https://.../import/:token
      const tokenMatch = trimmed.match(/\/import\/([a-zA-Z0-9-]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const token = tokenMatch[1];

        // Query Supabase RPC or local fallback
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.rpc('get_shared_document', { token });
          if (!error && data && data.length > 0) {
            setPreviewData(data[0]);
            setIsValidating(false);
            return;
          }
        }

        // Local fallback check
        const raw = localStorage.getItem('careercraft_local_documents');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((d: any) => d.share_token === token && d.is_shared);
          if (found) {
            setPreviewData(found);
            setIsValidating(false);
            return;
          }
        }

        setErrorMessage('Shared link token is invalid or has been revoked.');
        setIsValidating(false);
        return;
      }

      // Case 2: External Template JSON URL
      const response = await axios.get(trimmed, {
        timeout: 5000,
        maxContentLength: 1024 * 1024, // 1MB limit
      });

      const parsed = templateJsonSchema.safeParse(response.data);
      if (parsed.success) {
        setPreviewData(parsed.data);
      } else {
        setErrorMessage('The remote file does not conform to the CareerCraft document schema.');
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setErrorMessage('CORS or Network error: Unable to fetch remote URL. Ensure CORS is enabled on the host.');
      } else {
        setErrorMessage(err.message || 'Could not resolve document from link.');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = () => {
    if (!previewData) return;

    try {
      const doc = createNewDocument(
        previewData.type || 'resume',
        previewData.template_id || 'michael',
        `${previewData.title || 'Document'} (Imported)`
      );

      doc.content = JSON.parse(JSON.stringify(previewData.content || {}));
      doc.styles = JSON.parse(JSON.stringify(previewData.styles || {}));

      addToast('success', `Imported "${doc.title}"! Opening editor...`);
      onClose();
      navigate(`/editor/${doc.id}`);
    } catch (e) {
      addToast('error', 'Failed to import document.');
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      hudLabel="REMOTE IMPORT PROTOCOL"
      title="Import Document from Link"
      subtitle="Paste a CareerCraft share link or direct URL to a template JSON."
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <GlassInput
              terminalLabel="PASTE LINK / URL"
              placeholder="https://.../import/:token or https://.../template.json"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleValidate();
              }}
            />
          </div>
          <div className="pt-5">
            <NeonButton
              variant="secondary"
              size="md"
              isLoading={isValidating}
              onClick={handleValidate}
            >
              RESOLVE
            </NeonButton>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>[ERROR] {errorMessage}</span>
          </div>
        )}

        {previewData && (
          <div className="p-4 bg-white/[0.03] border border-[#00f0ff]/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#00f0ff] uppercase tracking-wider">
                // BLUEPRINT RESOLVED
              </span>
              <span className="text-xs font-mono font-bold text-[#39ff14] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
              </span>
            </div>

            <div>
              <div className="text-base font-bold text-white font-orbitron">{previewData.title}</div>
              <div className="text-xs text-slate-400 font-mono">
                Type: {previewData.type === 'resume' ? 'Resume / CV' : 'Cover Letter'} · Blueprint: {previewData.template_id}
              </div>
            </div>

            <NeonButton
              variant="primary"
              size="md"
              chamfer
              className="w-full justify-center"
              onClick={handleExecuteImport}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              IMPORT & OPEN IN EDITOR →
            </NeonButton>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
