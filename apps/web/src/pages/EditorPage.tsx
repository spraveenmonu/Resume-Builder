import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Sliders,
  Sparkles,
  Check,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { GlassNavbar } from '../components/layout/GlassNavbar.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { GlassInput } from '../components/ui/GlassInput.js';
import { GlassSelect } from '../components/ui/GlassSelect.js';
import { GlassTextarea } from '../components/ui/GlassTextarea.js';
import { GlassSlider } from '../components/ui/GlassSlider.js';
import { NeonButton } from '../components/ui/NeonButton.js';
import { GlassModal } from '../components/ui/GlassModal.js';
import { ResumeRenderer } from '../templates/ResumeRenderer.js';
import { CoverLetterRenderer } from '../templates/CoverLetterRenderer.js';
import { RESUME_TEMPLATES, COVER_LETTER_TEMPLATES } from '../templates/registry.js';
import { useDocumentStore, DocumentItem } from '../stores/document.store.js';
import { useUiStore } from '../stores/ui.store.js';

const GOOGLE_FONTS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Montserrat',
  'Lato',
  'Playfair Display',
  'Merriweather',
  'Open Sans',
  'Raleway',
  'Nunito',
  'Source Sans 3',
  'JetBrains Mono',
];

const PRESET_PALETTES = [
  { name: 'Emerald', accent: '#064e3b' },
  { name: 'Teal', accent: '#0f766e' },
  { name: 'Cyan', accent: '#0284c7' },
  { name: 'Navy', accent: '#1e3a8a' },
  { name: 'Amber', accent: '#d97706' },
  { name: 'Gold', accent: '#cca352' },
  { name: 'Slate', accent: '#374151' },
  { name: 'Neon Cyan', accent: '#00f0ff' },
  { name: 'Neon Pink', accent: '#ff2bd6' },
];

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const {
    currentDocument,
    setCurrentDocument,
    documentsList,
    fetchDocuments,
    updateContent,
    updateStyles,
    updateTitle,
    setTemplateId,
    saveStatus,
    undo,
    redo,
    generateShareToken,
    revokeShareToken,
  } = useDocumentStore();

  const [activeSidebarTab, setActiveSidebarTab] = useState<'content' | 'design' | 'template'>('content');
  const [zoomScale, setZoomScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewDocRef = useRef<HTMLDivElement>(null);

  // Load document on mount or parameter change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (id) {
      const doc = documentsList.find((d) => d.id === id);
      if (doc) {
        setCurrentDocument(doc);
      }
    } else if (documentsList.length > 0 && !currentDocument) {
      setCurrentDocument(documentsList[0]);
    }
  }, [id, documentsList, currentDocument, setCurrentDocument]);

  // Auto-fit A4 preview to screen using ResizeObserver
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const containerWidth = container.clientWidth - 48; // padding margin
      const a4WidthPx = 794; // approx 210mm in px at 96dpi
      if (containerWidth < a4WidthPx) {
        const calculated = Math.max(0.45, containerWidth / a4WidthPx);
        setZoomScale(calculated);
      } else {
        setZoomScale(1);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (!currentDocument) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#05060f] gap-4">
        <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin" />
        <span className="font-mono text-xs text-[#00f0ff] tracking-widest uppercase">
          // LOADING DOCUMENT ARCHITECTURE...
        </span>
      </div>
    );
  }

  const isResume = currentDocument.type === 'resume';
  const availableTemplates = isResume ? RESUME_TEMPLATES : COVER_LETTER_TEMPLATES;

  // --- Handlers ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Profile photo must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateContent((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          photo: {
            ...prev.personal?.photo,
            url: dataUrl,
          },
        },
      }));
      addToast('success', 'Profile photo updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleExportPDF = async () => {
    if (!previewDocRef.current) return;
    setIsExporting(true);

    try {
      const element = previewDocRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: currentDocument.styles?.backgroundColor || '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`${currentDocument.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      addToast('success', 'Pristine A4 PDF downloaded.');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('error', 'Could not generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    if (!previewDocRef.current) return;
    setIsExporting(true);

    try {
      const element = previewDocRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${currentDocument.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      link.click();
      addToast('success', 'Pristine PNG exported.');
    } catch (err) {
      console.error('PNG export error:', err);
      addToast('error', 'Could not export PNG.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenShareModal = async () => {
    try {
      const token = currentDocument.share_token || (await generateShareToken(currentDocument.id));
      const fullUrl = `${window.location.origin}/import/${token}`;
      setShareLink(fullUrl);
      setShareModalOpen(true);
    } catch (e) {
      addToast('error', 'Could not generate share link.');
    }
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    addToast('success', 'Share link copied to clipboard.');
  };

  return (
    <div className="h-dvh flex flex-col bg-[#05060f] overflow-hidden">
      {/* 1. Sticky Glass Toolbar */}
      <header className="sticky top-0 z-40 w-full glass-strong border-b border-[#00f0ff]/20 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">DOCUMENTS</span>
          </Link>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          {/* Document Title Input */}
          <input
            type="text"
            value={currentDocument.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent border border-transparent hover:border-white/20 focus:border-[#00f0ff] rounded-md px-2 py-1 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#00f0ff] w-48 sm:w-64 font-orbitron"
          />

          {/* Auto-Save Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono select-none">
            {saveStatus === 'saving' && (
              <span className="text-[#f9f002] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> SAVING...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[#39ff14] flex items-center gap-1">
                <Check className="w-3 h-3" /> SAVED
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-400 font-bold">OFFLINE (CACHED)</span>
            )}
          </div>
        </div>

        {/* Toolbar Center: Undo / Redo / Zoom */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={undo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 transition-all"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5 transition-all"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            onClick={() => setZoomScale((z) => Math.max(0.4, z - 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-[#00f0ff] min-w-[45px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#00f0ff] hover:bg-white/5"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Right: Share & Export */}
        <div className="flex items-center gap-2">
          <NeonButton
            variant="ghost"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={handleOpenShareModal}
          >
            <span className="hidden sm:inline">SHARE</span>
          </NeonButton>

          <NeonButton
            variant="secondary"
            size="sm"
            onClick={handleExportPNG}
            isLoading={isExporting}
          >
            PNG
          </NeonButton>

          <NeonButton
            variant="primary"
            size="sm"
            chamfer
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
            isLoading={isExporting}
          >
            <span>DOWNLOAD PDF</span>
          </NeonButton>
        </div>
      </header>

      {/* 2. Workspace Layout: Split Panes (Sidebar vs A4 Live Preview) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side Panel (Customizer HUD) */}
        <aside className="w-full sm:w-[380px] lg:w-[420px] glass-panel border-r border-[#00f0ff]/20 flex flex-col flex-shrink-0 h-full overflow-hidden">
          {/* Sub-tabs bar: Content vs Design vs Template */}
          <div className="flex border-b border-white/10 p-2 gap-1 bg-[#0a0b1e]/80 flex-shrink-0">
            <button
              onClick={() => setActiveSidebarTab('content')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeSidebarTab === 'content'
                  ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Content
            </button>
            <button
              onClick={() => setActiveSidebarTab('design')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeSidebarTab === 'design'
                  ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Design
            </button>
            <button
              onClick={() => setActiveSidebarTab('template')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                activeSidebarTab === 'template'
                  ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Template
            </button>
          </div>

          {/* Side Panel Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* TAB 1: CONTENT EDITOR */}
            {activeSidebarTab === 'content' && (
              <div className="space-y-6">
                {/* A. Resume Content Fields */}
                {isResume ? (
                  <>
                    {/* Personal Details Card */}
                    <GlassCard variant="default" className="p-4 space-y-3">
                      <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider flex items-center justify-between">
                        <span>// CONTACT PROFILE</span>
                      </h3>
                      <GlassInput
                        terminalLabel="CANDIDATE NAME"
                        value={currentDocument.content?.personal?.name || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, name: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="TITLE / ROLE"
                        value={currentDocument.content?.personal?.title || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, title: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="EMAIL"
                        type="email"
                        value={currentDocument.content?.personal?.email || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, email: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="PHONE"
                        value={currentDocument.content?.personal?.phone || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, phone: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="LOCATION"
                        value={currentDocument.content?.personal?.location || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            personal: { ...prev.personal, location: e.target.value },
                          }))
                        }
                      />

                      {/* Photo Upload & Shape */}
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <label className="text-xs font-mono font-medium text-[#00f0ff] tracking-wider uppercase block">
                          &gt; PROFILE PHOTO
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 glass border border-white/10 hover:border-[#00f0ff]/50 rounded-lg text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Avatar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoUpload}
                            />
                          </label>
                          {currentDocument.content?.personal?.photo?.url && (
                            <button
                              type="button"
                              onClick={() =>
                                updateContent((prev) => ({
                                  ...prev,
                                  personal: { ...prev.personal, photo: { ...prev.personal?.photo, url: null } },
                                }))
                              }
                              className="text-xs font-mono text-rose-400 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {currentDocument.content?.personal?.photo?.url && (
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {['circle', 'rounded-square', 'square'].map((shape) => (
                              <button
                                key={shape}
                                type="button"
                                onClick={() =>
                                  updateContent((prev) => ({
                                    ...prev,
                                    personal: {
                                      ...prev.personal,
                                      photo: { ...prev.personal?.photo, shape },
                                    },
                                  }))
                                }
                                className={`py-1 text-[11px] font-mono uppercase rounded border transition-all ${
                                  currentDocument.content?.personal?.photo?.shape === shape
                                    ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
                                    : 'border-white/10 text-slate-400'
                                }`}
                              >
                                {shape}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </GlassCard>

                    {/* Professional Summary */}
                    <GlassCard variant="default" className="p-4 space-y-2">
                      <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                        // PROFESSIONAL SUMMARY
                      </h3>
                      <GlassTextarea
                        rows={4}
                        value={currentDocument.content?.summary || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                      />
                    </GlassCard>

                    {/* Work Experience */}
                    <GlassCard variant="default" className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                          // EXPERIENCE ITEMS
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            updateContent((prev) => {
                              const expSec = prev.sections?.find((s: any) => s.type === 'experience');
                              if (!expSec) return prev;
                              const newItem = {
                                id: crypto.randomUUID(),
                                title: 'New Role / Position',
                                company: 'Company Name',
                                location: 'City, State',
                                date: '2023 — Present',
                                desc: '• Key achievement with quantifiable metrics',
                              };
                              return {
                                ...prev,
                                sections: prev.sections.map((s: any) =>
                                  s.type === 'experience' ? { ...s, items: [newItem, ...s.items] } : s
                                ),
                              };
                            });
                          }}
                          className="flex items-center gap-1 text-xs font-mono text-[#00f0ff] hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Role
                        </button>
                      </div>

                      {currentDocument.content?.sections
                        ?.find((s: any) => s.type === 'experience')
                        ?.items?.map((item: any, idx: number) => (
                          <div key={item.id} className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                Entry #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  updateContent((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s: any) =>
                                      s.type === 'experience'
                                        ? { ...s, items: s.items.filter((it: any) => it.id !== item.id) }
                                        : s
                                    ),
                                  }));
                                }}
                                className="text-rose-400 hover:text-rose-300 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <GlassInput
                              terminalLabel="ROLE TITLE"
                              value={item.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s: any) =>
                                    s.type === 'experience'
                                      ? {
                                          ...s,
                                          items: s.items.map((it: any) =>
                                            it.id === item.id ? { ...it, title: val } : it
                                          ),
                                        }
                                      : s
                                  ),
                                }));
                              }}
                            />
                            <GlassInput
                              terminalLabel="ORGANIZATION"
                              value={item.company}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s: any) =>
                                    s.type === 'experience'
                                      ? {
                                          ...s,
                                          items: s.items.map((it: any) =>
                                            it.id === item.id ? { ...it, company: val } : it
                                          ),
                                        }
                                      : s
                                  ),
                                }));
                              }}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <GlassInput
                                terminalLabel="DATES"
                                value={item.date}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateContent((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s: any) =>
                                      s.type === 'experience'
                                        ? {
                                            ...s,
                                            items: s.items.map((it: any) =>
                                              it.id === item.id ? { ...it, date: val } : it
                                            ),
                                          }
                                        : s
                                    ),
                                  }));
                                }}
                              />
                              <GlassInput
                                terminalLabel="LOCATION"
                                value={item.location || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateContent((prev) => ({
                                    ...prev,
                                    sections: prev.sections.map((s: any) =>
                                      s.type === 'experience'
                                        ? {
                                            ...s,
                                            items: s.items.map((it: any) =>
                                              it.id === item.id ? { ...it, location: val } : it
                                            ),
                                          }
                                        : s
                                    ),
                                  }));
                                }}
                              />
                            </div>
                            <GlassTextarea
                              terminalLabel="ACCOMPLISHMENTS"
                              rows={3}
                              value={item.desc}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateContent((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s: any) =>
                                    s.type === 'experience'
                                      ? {
                                          ...s,
                                          items: s.items.map((it: any) =>
                                            it.id === item.id ? { ...it, desc: val } : it
                                          ),
                                        }
                                      : s
                                  ),
                                }));
                              }}
                            />
                          </div>
                        ))}
                    </GlassCard>
                  </>
                ) : (
                  /* B. Cover Letter Content Fields */
                  <>
                    <GlassCard variant="default" className="p-4 space-y-3">
                      <h3 className="text-xs font-mono font-bold text-[#ff2bd6] uppercase tracking-wider">
                        // SENDER PROFILE
                      </h3>
                      <GlassInput
                        terminalLabel="YOUR NAME"
                        value={currentDocument.content?.sender?.name || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            sender: { ...prev.sender, name: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="YOUR TITLE"
                        value={currentDocument.content?.sender?.title || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            sender: { ...prev.sender, title: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="YOUR EMAIL"
                        value={currentDocument.content?.sender?.email || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            sender: { ...prev.sender, email: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="YOUR PHONE"
                        value={currentDocument.content?.sender?.phone || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            sender: { ...prev.sender, phone: e.target.value },
                          }))
                        }
                      />
                    </GlassCard>

                    <GlassCard variant="default" className="p-4 space-y-3">
                      <h3 className="text-xs font-mono font-bold text-[#ff2bd6] uppercase tracking-wider">
                        // RECIPIENT & COMPANY
                      </h3>
                      <GlassInput
                        terminalLabel="RECIPIENT NAME / TEAM"
                        value={currentDocument.content?.recipient?.name || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            recipient: { ...prev.recipient, name: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="COMPANY"
                        value={currentDocument.content?.recipient?.company || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            recipient: { ...prev.recipient, company: e.target.value },
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="COMPANY LOCATION"
                        value={currentDocument.content?.recipient?.address || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            recipient: { ...prev.recipient, address: e.target.value },
                          }))
                        }
                      />
                    </GlassCard>

                    <GlassCard variant="default" className="p-4 space-y-3">
                      <h3 className="text-xs font-mono font-bold text-[#ff2bd6] uppercase tracking-wider">
                        // LETTER BODY
                      </h3>
                      <GlassInput
                        terminalLabel="SUBJECT LINE"
                        value={currentDocument.content?.subject || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                      />
                      <GlassInput
                        terminalLabel="SALUTATION"
                        value={currentDocument.content?.salutation || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            salutation: e.target.value,
                          }))
                        }
                      />
                      <GlassTextarea
                        terminalLabel="BODY PARAGRAPHS"
                        rows={8}
                        value={currentDocument.content?.body || ''}
                        onChange={(e) =>
                          updateContent((prev) => ({
                            ...prev,
                            body: e.target.value,
                          }))
                        }
                      />
                    </GlassCard>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: DESIGN & TOKENS */}
            {activeSidebarTab === 'design' && (
              <div className="space-y-5">
                {/* Font Selection (10 Google Fonts) */}
                <GlassCard variant="default" className="p-4 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                    // TYPOGRAPHY (10+ GOOGLE FONTS)
                  </h3>
                  <GlassSelect
                    terminalLabel="PRIMARY FONT FAMILY"
                    value={currentDocument.styles?.fontFamily || 'Inter'}
                    onChange={(e) =>
                      updateStyles((prev) => ({ ...prev, fontFamily: e.target.value }))
                    }
                    options={GOOGLE_FONTS.map((font) => ({ value: font, label: font }))}
                  />

                  {isResume && (
                    <>
                      <GlassSlider
                        label="Candidate Name Size"
                        min={18}
                        max={36}
                        unit="pt"
                        value={currentDocument.styles?.fontSizeNamePt || 26}
                        onChange={(val) =>
                          updateStyles((prev) => ({ ...prev, fontSizeNamePt: val }))
                        }
                      />
                      <GlassSlider
                        label="Section Headings Size"
                        min={10}
                        max={18}
                        unit="pt"
                        value={currentDocument.styles?.fontSizeHeadingsPt || 13}
                        onChange={(val) =>
                          updateStyles((prev) => ({ ...prev, fontSizeHeadingsPt: val }))
                        }
                      />
                    </>
                  )}

                  <GlassSlider
                    label="Body Text Size"
                    min={8.5}
                    max={13}
                    step={0.5}
                    unit="pt"
                    value={currentDocument.styles?.fontSizeBodyPt || 10}
                    onChange={(val) =>
                      updateStyles((prev) => ({ ...prev, fontSizeBodyPt: val }))
                    }
                  />

                  <GlassSlider
                    label="Line Height"
                    min={1.2}
                    max={2.0}
                    step={0.05}
                    value={currentDocument.styles?.lineHeight || 1.45}
                    onChange={(val) =>
                      updateStyles((prev) => ({ ...prev, lineHeight: val }))
                    }
                  />
                </GlassCard>

                {/* Color Palettes & Custom Accents */}
                <GlassCard variant="default" className="p-4 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                    // ACCENT COLOR PALETTE
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_PALETTES.map((p) => (
                      <button
                        key={p.accent}
                        type="button"
                        onClick={() =>
                          updateStyles((prev) => ({ ...prev, accentColor: p.accent }))
                        }
                        className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                          currentDocument.styles?.accentColor === p.accent
                            ? 'ring-2 ring-white scale-105 shadow-md'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.accent }}
                        title={p.name}
                      >
                        {currentDocument.styles?.accentColor === p.accent && (
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300">CUSTOM ACCENT:</span>
                    <input
                      type="color"
                      value={currentDocument.styles?.accentColor || '#00f0ff'}
                      onChange={(e) =>
                        updateStyles((prev) => ({ ...prev, accentColor: e.target.value }))
                      }
                      className="w-10 h-7 rounded border border-white/20 bg-transparent cursor-pointer"
                    />
                  </div>
                </GlassCard>

                {/* Spacing & Margins */}
                <GlassCard variant="default" className="p-4 space-y-3">
                  <h3 className="text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                    // LAYOUT & MARGINS
                  </h3>
                  <GlassSlider
                    label="Page Margins"
                    min={10}
                    max={30}
                    unit="mm"
                    value={currentDocument.styles?.marginMm || 15}
                    onChange={(val) =>
                      updateStyles((prev) => ({ ...prev, marginMm: val }))
                    }
                  />

                  {isResume && (
                    <GlassSlider
                      label="Section Spacing"
                      min={3}
                      max={15}
                      unit="mm"
                      value={currentDocument.styles?.sectionSpacingMm || 6}
                      onChange={(val) =>
                        updateStyles((prev) => ({ ...prev, sectionSpacingMm: val }))
                      }
                    />
                  )}
                </GlassCard>
              </div>
            )}

            {/* TAB 3: TEMPLATE SWITCHER */}
            {activeSidebarTab === 'template' && (
              <div className="space-y-4">
                <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-wider block">
                  // SELECT BLUEPRINT STYLE
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {availableTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      className={`p-3 rounded-xl glass text-left border transition-all ${
                        currentDocument.template_id === tpl.id
                          ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-neon-cyan'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-md mb-2 flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: tpl.color }}
                      >
                        {tpl.name.split(' ')[0]}
                      </div>
                      <div className="text-xs font-bold text-white truncate font-orbitron">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {tpl.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Live Canvas (A4 Sheet Preview) */}
        <main
          ref={previewContainerRef}
          className="flex-1 bg-[#05060f] cyber-grid flex flex-col items-center justify-start p-6 overflow-y-auto min-h-0 relative select-none"
        >
          {/* Zoom Level Indicator */}
          <div className="sticky top-2 z-20 self-end glass px-3 py-1 rounded-full border border-white/10 text-xs font-mono text-[#00f0ff] shadow-md flex items-center gap-1.5 mb-2">
            <span>A4 SCALE:</span>
            <strong>{Math.round(zoomScale * 100)}%</strong>
          </div>

          {/* Scaled A4 Document Container */}
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.1s ease-out',
            }}
            className="my-auto pb-10"
          >
            <div ref={previewDocRef} className="shadow-2xl">
              {isResume ? (
                <ResumeRenderer
                  content={currentDocument.content}
                  styles={currentDocument.styles}
                  templateId={currentDocument.template_id}
                />
              ) : (
                <CoverLetterRenderer
                  content={currentDocument.content}
                  styles={currentDocument.styles}
                  templateId={currentDocument.template_id}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Share Document Link Modal */}
      <GlassModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        hudLabel="SECURITY PROTOCOL"
        title="Share Document"
        subtitle="Anyone with this secure link can preview your document without logging in."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GlassInput
              readOnly
              value={shareLink}
              className="font-mono text-xs text-[#00f0ff]"
            />
            <NeonButton
              variant="secondary"
              size="md"
              leftIcon={copiedLink ? <CheckCircle className="w-4 h-4 text-[#39ff14]" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyShareLink}
            >
              {copiedLink ? 'COPIED' : 'COPY'}
            </NeonButton>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              STATUS: PUBLIC ACCESS GRANTED
            </span>
            <button
              type="button"
              onClick={async () => {
                await revokeShareToken(currentDocument.id);
                setShareModalOpen(false);
                addToast('info', 'Public share link revoked.');
              }}
              className="text-xs text-rose-400 font-mono hover:underline"
            >
              REVOKE ACCESS
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
