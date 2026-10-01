import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, ShieldAlert, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { GlassModal } from '../ui/GlassModal.js';
import { GlassInput } from '../ui/GlassInput.js';
import { GlassTextarea } from '../ui/GlassTextarea.js';
import { GlassSelect } from '../ui/GlassSelect.js';
import { NeonButton } from '../ui/NeonButton.js';
import { parseResumeFile, parseRawText, ParsedResumeResult } from '../../lib/importers/resumeParser.js';
import { RESUME_TEMPLATES } from '../../templates/registry.js';
import { useDocumentStore } from '../../stores/document.store.js';
import { useUiStore } from '../../stores/ui.store.js';

export interface ImportResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportResumeModal: React.FC<ImportResumeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const { createNewDocument } = useDocumentStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [rawText, setRawText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('michael');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const result = await parseResumeFile(file);
      setParsedResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not parse resume file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteParse = () => {
    if (!rawText.trim()) {
      setErrorMessage('Please paste resume text before parsing.');
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const result = parseRawText(rawText);
      setParsedResult(result);
    } catch (err: any) {
      setErrorMessage('Could not extract sections from text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmAndOpen = () => {
    if (!parsedResult) return;

    try {
      const doc = createNewDocument(
        'resume',
        selectedTemplate,
        `${parsedResult.personal?.name || 'Resume'} (Imported)`
      );

      // Apply parsed fields
      doc.content = {
        personal: {
          name: parsedResult.personal?.name || 'Candidate Name',
          title: parsedResult.personal?.title || 'Professional Title',
          email: parsedResult.personal?.email || '',
          phone: parsedResult.personal?.phone || '',
          location: parsedResult.personal?.location || '',
          links: parsedResult.personal?.links || [],
          photo: { url: null, shape: 'circle', size: 100 },
        },
        summary: parsedResult.summary || '',
        sections: parsedResult.sections || [],
      };

      addToast('success', 'Resume parsed and loaded into editor.');
      onClose();
      navigate(`/editor/${doc.id}`);
    } catch (e) {
      addToast('error', 'Failed to generate document from parsed data.');
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      hudLabel="RESUME IMPORT PIPELINE"
      title="Import Existing Resume"
      subtitle="Parse PDF, DOCX, TXT, or JSON client-side with zero data uploads."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Step 1: Mode Switcher (Upload vs Paste) */}
        {!parsedResult && (
          <div className="space-y-4">
            <div className="flex border-b border-white/10 p-1 gap-2 bg-white/[0.02] rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> File Upload (.pdf, .docx, .txt, .json)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'paste'
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste Raw Text
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>[ERROR] {errorMessage}</span>
              </div>
            )}

            {activeTab === 'upload' ? (
              /* Drag & Drop Dropzone */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-neon-cyan'
                    : 'border-white/20 hover:border-[#00f0ff]/50 bg-white/[0.02]'
                }`}
                onClick={() => document.getElementById('resumeFileInput')?.click()}
              >
                <input
                  id="resumeFileInput"
                  type="file"
                  accept=".pdf,.docx,.txt,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                  }}
                />
                <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] flex items-center justify-center mb-3">
                  {isParsing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-base font-bold font-orbitron text-white">
                  {isParsing ? 'PARSING DOCUMENT IN BROWSER...' : 'Click or Drag & Drop Resume File'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Supports PDF, Microsoft Word (.docx), plain text (.txt), and JSON exports (Max 5MB).
                </p>
              </div>
            ) : (
              /* Paste Raw Text */
              <div className="space-y-3">
                <GlassTextarea
                  rows={8}
                  placeholder="Paste copied text from a PDF, LinkedIn export, or Word document..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                <NeonButton
                  variant="primary"
                  size="md"
                  chamfer
                  isLoading={isParsing}
                  onClick={handlePasteParse}
                  className="w-full justify-center"
                >
                  EXTRACT RESUME SECTIONS →
                </NeonButton>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review & Confirm Screen */}
        {parsedResult && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#39ff14]">
                <CheckCircle2 className="w-4 h-4" />
                <span>// SECTIONS EXTRACTED SUCCESSFULLY</span>
              </div>
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="text-xs font-mono text-slate-400 hover:text-white underline"
              >
                Upload Different File
              </button>
            </div>

            {/* Extracted Fields Review */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                terminalLabel="NAME DETECTED"
                value={parsedResult.personal?.name || ''}
                onChange={(e) =>
                  setParsedResult((prev: any) => ({
                    ...prev,
                    personal: { ...prev.personal, name: e.target.value },
                  }))
                }
              />
              <GlassInput
                terminalLabel="TITLE DETECTED"
                value={parsedResult.personal?.title || ''}
                onChange={(e) =>
                  setParsedResult((prev: any) => ({
                    ...prev,
                    personal: { ...prev.personal, title: e.target.value },
                  }))
                }
              />
              <GlassInput
                terminalLabel="EMAIL"
                value={parsedResult.personal?.email || ''}
                onChange={(e) =>
                  setParsedResult((prev: any) => ({
                    ...prev,
                    personal: { ...prev.personal, email: e.target.value },
                  }))
                }
              />
              <GlassInput
                terminalLabel="PHONE"
                value={parsedResult.personal?.phone || ''}
                onChange={(e) =>
                  setParsedResult((prev: any) => ({
                    ...prev,
                    personal: { ...prev.personal, phone: e.target.value },
                  }))
                }
              />
            </div>

            {/* Summary */}
            <GlassTextarea
              terminalLabel="SUMMARY EXTRACTED"
              rows={3}
              value={parsedResult.summary || ''}
              onChange={(e) =>
                setParsedResult((prev: any) => ({
                  ...prev,
                  summary: e.target.value,
                }))
              }
            />

            {/* Blueprint Selection for Imported Document */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#00f0ff] tracking-wider uppercase block">
                &gt; SELECT TARGET BLUEPRINT STYLE
              </label>
              <GlassSelect
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                options={RESUME_TEMPLATES.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.category})`,
                }))}
              />
            </div>

            <NeonButton
              variant="primary"
              size="lg"
              chamfer
              className="w-full justify-center"
              leftIcon={<Sparkles className="w-5 h-5" />}
              onClick={handleConfirmAndOpen}
            >
              CONFIRM & OPEN IN CUSTOMIZATION EDITOR →
            </NeonButton>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
