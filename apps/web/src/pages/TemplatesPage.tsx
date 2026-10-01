import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Layers, FileText, Mail, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GlassNavbar } from '../components/layout/GlassNavbar.js';
import { GlassBackground } from '../components/ui/GlassBackground.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { GlassInput } from '../components/ui/GlassInput.js';
import { NeonButton } from '../components/ui/NeonButton.js';
import { RESUME_TEMPLATES, COVER_LETTER_TEMPLATES, TemplateConfig } from '../templates/registry.js';
import { ChooseDocTypeModal } from '../components/modals/ChooseDocTypeModal.js';
import { useDocumentStore } from '../stores/document.store.js';

type CategoryFilter = 'All' | 'Modern' | 'Minimal' | 'Creative' | 'ATS' | 'Professional' | 'Cyberpunk';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { createNewDocument } = useDocumentStore();
  const [docTypeTab, setDocTypeTab] = useState<'resume' | 'cover_letter'>('resume');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTplForModal, setSelectedTplForModal] = useState<TemplateConfig | null>(null);

  const activeTemplates = docTypeTab === 'resume' ? RESUME_TEMPLATES : COVER_LETTER_TEMPLATES;

  const filteredTemplates = useMemo(() => {
    return activeTemplates.filter((tpl) => {
      const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
      const matchesSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeTemplates, selectedCategory, searchQuery]);

  const handleSelectTemplate = (tpl: TemplateConfig) => {
    setSelectedTplForModal(tpl);
  };

  const handleConfirmDocType = (docType: 'resume' | 'cover_letter', title: string, templateId: string) => {
    const doc = createNewDocument(docType, templateId, title);
    navigate(`/editor/${doc.id}`);
  };

  const categories: CategoryFilter[] = ['All', 'ATS', 'Modern', 'Minimal', 'Creative', 'Professional', 'Cyberpunk'];

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-hidden">
      <GlassBackground />
      <GlassNavbar onOpenCreateModal={() => setSelectedTplForModal(RESUME_TEMPLATES[0])} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header HUD */}
        <div className="space-y-3">
          <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest block">
            // BLUEPRINT ARCHIVE
          </span>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-orbitron text-white tracking-wide flex items-center gap-3">
                <Layers className="w-8 h-8 text-[#00f0ff]" />
                TEMPLATE CATALOG
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Choose an ATS-compliant layout or cyber-aesthetic theme to generate your Resume or matching Cover Letter.
              </p>
            </div>

            {/* Document Type Switcher (Resume vs Cover Letter) */}
            <div className="glass p-1.5 rounded-xl border border-white/10 flex items-center gap-1 self-start sm:self-auto">
              <button
                onClick={() => setDocTypeTab('resume')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  docTypeTab === 'resume'
                    ? 'bg-[#00f0ff] text-black shadow-neon-cyan'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                Resumes ({RESUME_TEMPLATES.length})
              </button>
              <button
                onClick={() => setDocTypeTab('cover_letter')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  docTypeTab === 'cover_letter'
                    ? 'bg-[#ff2bd6] text-black shadow-neon-pink'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Mail className="w-4 h-4" />
                Cover Letters ({COVER_LETTER_TEMPLATES.length})
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls: Search & Category Tabs */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="w-full sm:w-80">
              <GlassInput
                placeholder="Search templates, styles, keywords..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                    selectedCategory === cat
                      ? 'bg-white/15 text-[#00f0ff] border border-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cyberpunk Note if Cyberpunk filter selected */}
        {selectedCategory === 'Cyberpunk' && (
          <div className="p-4 rounded-xl glass border border-[#f9f002]/40 bg-[#f9f002]/5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#f9f002] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-[#f9f002] uppercase font-mono block mb-0.5">Recruiter ATS Guidance:</strong>
              Cyberpunk dark-themed templates are visually striking for portfolio websites, tech showcases, and creative directors. For automated enterprise ATS scanning portals, light/standard templates (Emerald, Navy, Slate) offer maximal parsing reliability.
            </div>
          </div>
        )}

        {/* Templates Grid with 3D Hover Tilt Glass Cards */}
        {filteredTemplates.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-white/10 text-center space-y-3">
            <span className="text-xs font-mono text-slate-400">// NO MATCHING BLUEPRINTS FOUND</span>
            <h3 className="text-xl font-bold font-orbitron text-white">No Templates Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or reset the category filter to view all templates.
            </p>
            <NeonButton variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
              RESET FILTERS
            </NeonButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((tpl) => (
              <GlassCard
                key={tpl.id}
                variant="interactive"
                hudCorners
                onClick={() => handleSelectTemplate(tpl)}
                className="p-4 flex flex-col justify-between h-full group"
              >
                <div>
                  {/* Visual Preview Box */}
                  <div
                    className="w-full h-64 rounded-xl relative overflow-hidden flex flex-col justify-between p-4 border border-white/10 group-hover:border-[#00f0ff]/50 transition-colors shadow-lg"
                    style={{ backgroundColor: tpl.color }}
                  >
                    <div className="flex items-center justify-between">
                      {tpl.badge ? (
                        <span className="text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white border border-white/20">
                          {tpl.badge}
                        </span>
                      ) : <span />}

                      {tpl.atsSafe && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-950/80 backdrop-blur-md text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> ATS SAFE
                        </span>
                      )}
                    </div>

                    {/* Simulated Miniature Document Representation */}
                    <div className="bg-black/85 backdrop-blur-md p-3.5 rounded-lg border border-white/10 space-y-1.5 text-left">
                      <div className="text-sm font-bold font-orbitron text-white truncate">
                        {tpl.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {tpl.category} · {tpl.columns === 2 ? '2-Column' : 'Single Column'}
                      </div>
                    </div>

                    {/* Hover Prompt */}
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <NeonButton variant="primary" size="sm">
                        SELECT STYLE
                      </NeonButton>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="font-bold text-white text-base group-hover:text-[#00f0ff] transition-colors">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Font: {tpl.font}</span>
                  <span className="text-[#00f0ff] font-bold group-hover:translate-x-1 transition-transform">
                    USE BLUEPRINT →
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>

      {/* Choice Modal (Resume vs Cover Letter) */}
      {selectedTplForModal && (
        <ChooseDocTypeModal
          isOpen={Boolean(selectedTplForModal)}
          onClose={() => setSelectedTplForModal(null)}
          templateId={selectedTplForModal.id}
          templateName={selectedTplForModal.name}
          onConfirm={handleConfirmDocType}
        />
      )}
    </div>
  );
};
