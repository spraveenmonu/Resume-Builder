import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  FileText,
  Sliders,
  Share2,
  Download,
  ArrowRight,
  CheckCircle2,
  Layers,
  Terminal,
} from 'lucide-react';
import { GlassNavbar } from '../components/layout/GlassNavbar.js';
import { GlassBackground } from '../components/ui/GlassBackground.js';
import { NeonButton } from '../components/ui/NeonButton.js';
import { GlassCard } from '../components/ui/GlassCard.js';
import { AnimatedText } from '../components/ui/AnimatedText.js';
import { GlitchText } from '../components/ui/GlitchText.js';
import { ChooseDocTypeModal } from '../components/modals/ChooseDocTypeModal.js';
import { useDocumentStore } from '../stores/document.store.js';

// Rotating typewriter words for the subtitle
const ROTATING_WORDS = ['Next-Gen AI Resume', 'Impactful Cover Letter', 'Recruiter-Ready Dossier', 'Cyber-Fast Career Brand'];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createNewDocument } = useDocumentStore();
  const [typewriterIndex, setTypewriterIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTplForModal, setSelectedTplForModal] = useState<{ id: string; name: string } | null>(null);

  // Typewriter effect
  useEffect(() => {
    const currentWord = ROTATING_WORDS[typewriterIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting && displayText === currentWord) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setTypewriterIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
      } else {
        setDisplayText(
          isDeleting
            ? currentWord.substring(0, displayText.length - 1)
            : currentWord.substring(0, displayText.length + 1)
        );
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, typewriterIndex]);

  // Featured sample templates for the carousel
  const FEATURED_TEMPLATES = [
    { id: 'michael', name: 'Emerald Executive', color: '#064e3b', category: 'ATS / Leadership', badge: 'POPULAR' },
    { id: 'nick', name: 'Teal Tech Lead', color: '#0f766e', category: 'Engineering & Systems', badge: 'HIGH ATS' },
    { id: 'olivia', name: 'Cyan Modern', color: '#0284c7', category: 'Product & Design', badge: 'MODERN' },
    { id: 'cyberpunk-neon', name: 'Cyberpunk Neon Matrix', color: '#00f0ff', category: 'Cyber / Dark Mode', badge: 'NEW' },
    { id: 'executive-navy', name: 'Navy Corporate', color: '#0f172a', category: 'Corporate / Finance', badge: 'CLEAN' },
    { id: 'jessica', name: 'Amber Serif Creative', color: '#d97706', category: 'Editorial & Marketing', badge: 'EDITORIAL' },
  ];

  const handleTemplateClick = (t: { id: string; name: string }) => {
    setSelectedTplForModal(t);
  };

  const handleConfirmDocType = (docType: 'resume' | 'cover_letter', title: string, templateId: string) => {
    const doc = createNewDocument(docType, templateId, title);
    navigate(`/editor/${doc.id}`);
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-hidden">
      <GlassBackground />
      <GlassNavbar onOpenCreateModal={() => setSelectedTplForModal({ id: 'michael', name: 'Emerald Executive' })} />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Monospace HUD pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-[#00f0ff]/30 text-xs font-mono text-[#00f0ff] mb-8 shadow-[0_0_15px_rgba(0,240,255,0.2)] select-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-ping" />
          <span>// CAREERCRAFT 2.0 PROTOCOL ACTIVATED</span>
        </motion.div>

        {/* Main Heading with AnimatedText & GlitchText */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold font-orbitron text-white tracking-tight max-w-5xl leading-[1.1] mb-6">
          <AnimatedText text="ENGINEER YOUR NEXT" />{' '}
          <span className="block mt-2">
            <span className="bg-gradient-to-r from-[#00f0ff] via-[#00ffcc] to-[#ff2bd6] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,240,255,0.5)]">
              <GlitchText text="HIGH-IMPACT" glowColor="cyan" />
            </span>{' '}
            <AnimatedText text="CAREER MOVE" />
          </span>
        </h1>

        {/* Typewriter Subtitle with blinking terminal cursor */}
        <div className="h-10 flex items-center justify-center font-mono text-base sm:text-xl text-slate-300 max-w-3xl mb-10">
          <span className="text-[#00f0ff] mr-2">&gt;</span>
          <span>Build your </span>
          <span className="text-[#ff2bd6] font-bold mx-1.5 underline decoration-[#ff2bd6]/40 underline-offset-4">
            {displayText}
          </span>
          <span className="w-2.5 h-5 bg-[#00f0ff] inline-block ml-1 animate-pulse" />
        </div>

        {/* CTA Button Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <NeonButton
            variant="primary"
            size="lg"
            chamfer
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => setSelectedTplForModal({ id: 'michael', name: 'Emerald Executive' })}
            className="w-full sm:w-auto"
          >
            CREATE FREE DOCUMENT
          </NeonButton>

          <Link to="/templates" className="w-full sm:w-auto">
            <NeonButton variant="secondary" size="lg" chamfer className="w-full sm:w-auto">
              EXPLORE TEMPLATES [20+]
            </NeonButton>
          </Link>
        </motion.div>

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full max-w-4xl"
        >
          {[
            { label: 'ATS SCAN SCORE', val: '98%', icon: <ShieldCheck className="w-4 h-4 text-[#39ff14]" /> },
            { label: 'TEMPLATE STYLES', val: '20+ PRO', icon: <Layers className="w-4 h-4 text-[#00f0ff]" /> },
            { label: 'EXPORT LATENCY', val: '< 0.8s', icon: <Zap className="w-4 h-4 text-[#f9f002]" /> },
            { label: 'OFFLINE CAPABLE', val: '100% PWA', icon: <Cpu className="w-4 h-4 text-[#ff2bd6]" /> },
          ].map((stat, i) => (
            <div key={i} className="glass p-4 rounded-xl border border-white/10 text-center flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1 uppercase tracking-wider">
                {stat.icon}
                <span>{stat.label}</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-orbitron text-white">
                {stat.val}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Interactive Template Carousel Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest block mb-1">
              // DESIGN MATRIX
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-orbitron text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#00f0ff]" />
              CHOOSE YOUR BLUEPRINT
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select any style below to instantly initiate your Resume or matching Cover Letter.
            </p>
          </div>
          <Link to="/templates">
            <NeonButton variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              VIEW FULL CATALOG →
            </NeonButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_TEMPLATES.map((tpl) => (
            <GlassCard
              key={tpl.id}
              variant="interactive"
              hudCorners
              onClick={() => handleTemplateClick(tpl)}
              className="p-4 flex flex-col h-full group"
            >
              {/* Preview Thumbnail Window */}
              <div
                className="w-full h-56 rounded-lg relative overflow-hidden flex flex-col justify-between p-4 border border-white/10 group-hover:border-[#00f0ff]/50 transition-colors"
                style={{ backgroundColor: tpl.color }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-white border border-white/20">
                    {tpl.badge}
                  </span>
                  <div className="w-3 h-3 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                </div>

                <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10 text-left">
                  <div className="text-sm font-bold text-white font-orbitron">{tpl.name}</div>
                  <div className="text-[11px] text-slate-300 font-mono">{tpl.category}</div>
                </div>

                {/* Hover Overlay Button */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                  <NeonButton variant="primary" size="sm">
                    SELECT FORMAT
                  </NeonButton>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-[#00f0ff] transition-colors">
                    {tpl.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{tpl.category}</span>
                </div>
                <span className="text-xs font-mono text-[#00f0ff] group-hover:translate-x-1 transition-transform">
                  USE →
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono text-[#ff2bd6] uppercase tracking-widest block mb-1">
            // CORE ARCHITECTURE
          </span>
          <h2 className="text-3xl font-bold font-orbitron text-white">
            DESIGNED FOR SPEED, CONTROL & ATS ACCEPTANCE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="cyan" hudCorners className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-orbitron text-white">Canva-Grade Customizer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fine-tune margins, typography scale, 10+ Google Fonts, and tailored accent palettes with instant live A4 updates.
            </p>
          </GlassCard>

          <GlassCard variant="pink" hudCorners className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#ff2bd6]/10 border border-[#ff2bd6]/40 text-[#ff2bd6] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-orbitron text-white">Share & Instant Import</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate secure, revocable share links or import existing PDF and DOCX files straight into your editor canvas.
            </p>
          </GlassCard>

          <GlassCard variant="purple" hudCorners className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/40 text-[#8b5cf6] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-orbitron text-white">Pristine Vector PDF</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your generated PDF and PNG downloads remain 100% clean, crisp, and print-ready with zero decorative UI artifacts.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 glass py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4 text-[#00f0ff]" />
            <span>CAREERCRAFT // AI RESUME & COVER LETTER PLATFORM</span>
          </div>
          <div className="text-slate-500">
            ENGINEERED WITH REACT, TAILWIND CSS & SUPABASE
          </div>
        </div>
      </footer>

      {/* Document Type Selection Modal */}
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
