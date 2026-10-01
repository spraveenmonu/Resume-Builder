import React, { useState } from 'react';
import { FileText, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { GlassModal } from '../ui/GlassModal.js';
import { GlassInput } from '../ui/GlassInput.js';
import { NeonButton } from '../ui/NeonButton.js';

export interface ChooseDocTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  templateName?: string;
  onConfirm: (docType: 'resume' | 'cover_letter', title: string, templateId: string) => void;
}

export const ChooseDocTypeModal: React.FC<ChooseDocTypeModalProps> = ({
  isOpen,
  onClose,
  templateId = 'michael',
  templateName = 'Professional Template',
  onConfirm,
}) => {
  const [docTitle, setDocTitle] = useState(`${templateName} Document`);

  const handleSelect = (docType: 'resume' | 'cover_letter') => {
    const defaultTitle = docTitle.trim() || (docType === 'resume' ? 'My Professional Resume' : 'My Cover Letter');
    onConfirm(docType, defaultTitle, templateId);
    onClose();
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      hudLabel="FORMAT SELECTION"
      title="What Do You Want To Create?"
      subtitle={`Selected style: ${templateName}`}
      maxWidth="md"
    >
      <div className="space-y-6">
        <GlassInput
          terminalLabel="DOCUMENT TITLE"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="e.g. Senior Software Engineer Resume"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option 1: Resume / CV */}
          <div
            onClick={() => handleSelect('resume')}
            className="group relative glass p-5 rounded-xl border border-white/10 hover:border-[#00f0ff] hover:shadow-neon-cyan hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-[#00f0ff] transition-colors">
                Resume / CV
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                ATS-optimized sections with experience, metrics, education, and customizable Canva-grade styling tokens.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1 text-xs font-mono font-bold text-[#00f0ff] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Build Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Option 2: Cover Letter */}
          <div
            onClick={() => handleSelect('cover_letter')}
            className="group relative glass p-5 rounded-xl border border-white/10 hover:border-[#ff2bd6] hover:shadow-neon-pink hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-lg bg-[#ff2bd6]/10 border border-[#ff2bd6]/30 text-[#ff2bd6] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-orbitron text-white group-hover:text-[#ff2bd6] transition-colors">
                Cover Letter
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Matching letterhead style, coordinated typography, recruiter addresses, and tailored AI writing tools.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1 text-xs font-mono font-bold text-[#ff2bd6] uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Build Cover Letter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
