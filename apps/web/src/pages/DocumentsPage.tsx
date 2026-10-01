import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  FileText,
  Mail,
  Copy,
  Trash2,
  Share2,
  ExternalLink,
  Search,
  Clock,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { GlassNavbar } from '../components/layout/GlassNavbar.js';
import { GlassBackground } from '../components/ui/GlassBackground.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { GlassInput } from '../components/ui/GlassInput.js';
import { NeonButton } from '../components/ui/NeonButton.js';
import { GlassModal } from '../components/ui/GlassModal.js';
import { ChooseDocTypeModal } from '../components/modals/ChooseDocTypeModal.js';
import { useDocumentStore, DocumentItem } from '../stores/document.store.js';
import { useUiStore } from '../stores/ui.store.js';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const {
    documentsList,
    fetchDocuments,
    setCurrentDocument,
    deleteDocument,
    duplicateDocument,
    generateShareToken,
    updateTitle,
    createNewDocument,
    isLoading,
  } = useDocumentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'resume' | 'cover_letter'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [newTitleVal, setNewTitleVal] = useState('');
  const [shareDoc, setShareDoc] = useState<DocumentItem | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = documentsList.filter((doc) => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.template_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleOpenDoc = (doc: DocumentItem) => {
    setCurrentDocument(doc);
    navigate(`/editor/${doc.id}`);
  };

  const handleDuplicate = async (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await duplicateDocument(doc.id);
      addToast('success', `Duplicated "${doc.title}"`);
    } catch {
      addToast('error', 'Could not duplicate document.');
    }
  };

  const handleDelete = async (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      await deleteDocument(doc.id);
      addToast('info', 'Document deleted.');
    }
  };

  const handleShare = async (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = doc.share_token || (await generateShareToken(doc.id));
      const url = `${window.location.origin}/import/${token}`;
      setShareDoc(doc);
      setShareUrl(url);
    } catch {
      addToast('error', 'Could not generate share link.');
    }
  };

  const handleRenameSubmit = () => {
    if (renameDoc && newTitleVal.trim()) {
      setCurrentDocument(renameDoc);
      updateTitle(newTitleVal.trim());
      addToast('success', 'Document title updated.');
      setRenameDoc(null);
    }
  };

  const handleCreateDoc = (docType: 'resume' | 'cover_letter', title: string, templateId: string) => {
    const doc = createNewDocument(docType, templateId, title);
    navigate(`/editor/${doc.id}`);
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-hidden">
      <GlassBackground />
      <GlassNavbar onOpenCreateModal={() => setCreateModalOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest block mb-1">
              // CLOUD VAULT
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-orbitron text-white tracking-wide flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-[#00f0ff]" />
              MY DOCUMENTS
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage, duplicate, share, and customize your saved resumes and cover letters.
            </p>
          </div>

          <NeonButton
            variant="primary"
            size="md"
            chamfer
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            CREATE NEW
          </NeonButton>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-80">
            <GlassInput
              placeholder="Search by title or blueprint..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {(['all', 'resume', 'cover_letter'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                  filterType === type
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {type === 'all' ? 'All' : type === 'resume' ? 'Resumes' : 'Cover Letters'}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocs.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-white/10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6 text-[#00f0ff]" />
            </div>
            <h3 className="text-xl font-bold font-orbitron text-white">No Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No documents match your query. Try resetting search filters.'
                : 'Your archive is currently empty. Create your first resume or cover letter now.'}
            </p>
            <NeonButton variant="primary" size="md" onClick={() => setCreateModalOpen(true)}>
              CREATE FIRST DOCUMENT →
            </NeonButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
              const isRes = doc.type === 'resume';
              const dateStr = doc.updated_at
                ? new Date(doc.updated_at).toLocaleDateString()
                : 'Recently';

              return (
                <GlassCard
                  key={doc.id}
                  variant="interactive"
                  hudCorners
                  onClick={() => handleOpenDoc(doc)}
                  className="p-5 flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                          isRes
                            ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                            : 'bg-[#ff2bd6]/10 text-[#ff2bd6] border-[#ff2bd6]/30'
                        }`}
                      >
                        {isRes ? <FileText className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {isRes ? 'Resume' : 'Cover Letter'}
                      </span>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-white font-orbitron group-hover:text-[#00f0ff] transition-colors truncate">
                        {doc.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
                        Blueprint: {doc.template_id}
                      </span>
                    </div>
                  </div>

                  {/* Hover Action Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameDoc(doc);
                          setNewTitleVal(doc.title);
                        }}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10"
                        title="Rename Document"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(doc, e)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10"
                        title="Duplicate Document"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleShare(doc, e)}
                        className="p-1.5 rounded text-slate-400 hover:text-[#00f0ff] hover:bg-white/10"
                        title="Share Document"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(doc, e)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>OPEN</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>

      {/* Rename Document Modal */}
      {renameDoc && (
        <GlassModal
          isOpen={Boolean(renameDoc)}
          onClose={() => setRenameDoc(null)}
          hudLabel="DOCUMENT METADATA"
          title="Rename Document"
        >
          <div className="space-y-4">
            <GlassInput
              terminalLabel="NEW TITLE"
              value={newTitleVal}
              onChange={(e) => setNewTitleVal(e.target.value)}
              autoFocus
            />
            <NeonButton variant="primary" size="md" onClick={handleRenameSubmit} className="w-full justify-center">
              UPDATE TITLE
            </NeonButton>
          </div>
        </GlassModal>
      )}

      {/* Share Document Link Modal */}
      {shareDoc && (
        <GlassModal
          isOpen={Boolean(shareDoc)}
          onClose={() => setShareDoc(null)}
          hudLabel="SECURITY PROTOCOL"
          title="Share Document"
          subtitle={`Public link for "${shareDoc.title}"`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GlassInput readOnly value={shareUrl} className="font-mono text-xs text-[#00f0ff]" />
              <NeonButton
                variant="secondary"
                size="md"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                  addToast('success', 'Copied to clipboard.');
                }}
              >
                {copiedLink ? 'COPIED' : 'COPY'}
              </NeonButton>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Anyone with this link can view the document. Login is required only to import into their own account.
            </p>
          </div>
        </GlassModal>
      )}

      {/* Create New Document Modal */}
      <ChooseDocTypeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        templateId="michael"
        templateName="Executive Emerald"
        onConfirm={handleCreateDoc}
      />
    </div>
  );
};
