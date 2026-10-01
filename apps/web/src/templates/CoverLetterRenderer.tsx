import React from 'react';
import { COVER_LETTER_TEMPLATES } from './registry.js';

export interface CoverLetterRendererProps {
  content: any;
  styles?: any;
  templateId?: string;
  className?: string;
}

export const CoverLetterRenderer: React.FC<CoverLetterRendererProps> = ({
  content,
  styles = {},
  templateId = 'cl-emerald',
  className = '',
}) => {
  const tpl = COVER_LETTER_TEMPLATES.find((t) => t.id === templateId) || COVER_LETTER_TEMPLATES[0];
  const isCyber = tpl.isCyberpunk;

  const fontFamily = styles.fontFamily || tpl.font || 'Inter';
  const fontSizeBody = `${styles.fontSizeBodyPt || 10.5}pt`;
  const lineHeight = styles.lineHeight || 1.6;
  const marginMm = styles.marginMm || 22;
  const accentColor = styles.accentColor || tpl.color || '#00f0ff';
  const headingsColor = isCyber ? (styles.headingsColor || '#00f0ff') : (styles.headingsColor || '#0f172a');
  const bodyColor = isCyber ? (styles.bodyColor || '#e2e8f0') : (styles.bodyColor || '#334155');
  const backgroundColor = isCyber ? '#0a0b1e' : (styles.backgroundColor || '#ffffff');

  const sender = content?.sender || {};
  const recipient = content?.recipient || {};
  const date = content?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const subject = content?.subject || '';
  const salutation = content?.salutation || 'Dear Hiring Team,';
  const body = content?.body || '';
  const signoff = content?.signoff || { text: 'Sincerely,', signatureName: sender.name || 'Candidate Name', title: sender.title };

  return (
    <div
      className={`print-page bg-white shadow-2xl relative box-border transition-all duration-150 ${className}`}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: `${marginMm}mm`,
        fontFamily,
        fontSize: fontSizeBody,
        lineHeight,
        color: bodyColor,
        backgroundColor,
      }}
    >
      {/* Top Template Accent Stripe */}
      <div 
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header Letterhead */}
      <header className={`pb-6 mb-8 border-b ${isCyber ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: headingsColor, fontFamily }}
            >
              {sender.name || 'Your Full Name'}
            </h1>
            <p className="font-semibold text-sm mt-0.5" style={{ color: accentColor }}>
              {sender.title || 'Professional Title'}
            </p>
          </div>

          {/* Sender Contact Details */}
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            {sender.email && <div>{sender.email}</div>}
            {sender.phone && <div>{sender.phone}</div>}
            {sender.location && <div>{sender.location}</div>}
            {sender.website && <div>{sender.website}</div>}
          </div>
        </div>
      </header>

      {/* Date & Recipient Details */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 text-xs">
        <div className="space-y-1">
          <div className="font-bold" style={{ color: headingsColor }}>
            {recipient.name || 'Hiring Team / Recruiter'}
          </div>
          {recipient.title && <div className="text-slate-500">{recipient.title}</div>}
          <div className="font-semibold" style={{ color: accentColor }}>
            {recipient.company || 'Company / Organization'}
          </div>
          {recipient.address && <div className="text-slate-500">{recipient.address}</div>}
        </div>

        <div className="font-medium text-slate-500">
          {date}
        </div>
      </div>

      {/* Subject Line */}
      {subject && (
        <div
          className="font-bold text-sm tracking-wide mb-6 pb-1 border-b"
          style={{ color: headingsColor, borderColor: isCyber ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}
        >
          RE: {subject}
        </div>
      )}

      {/* Salutation */}
      <div className="font-bold text-sm mb-4" style={{ color: headingsColor }}>
        {salutation}
      </div>

      {/* Letter Body Paragraphs */}
      <div className="space-y-4 leading-relaxed whitespace-pre-line text-justify mb-10">
        {body}
      </div>

      {/* Sign-off & Signature */}
      <div className="space-y-2 mt-8">
        <div>{signoff.text || 'Sincerely,'}</div>
        <div
          className="text-2xl font-serif italic py-1"
          style={{ color: accentColor, fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {signoff.signatureName || sender.name || 'Candidate Name'}
        </div>
        <div className="font-bold text-xs" style={{ color: headingsColor }}>
          {signoff.signatureName || sender.name}
        </div>
        {signoff.title && (
          <div className="text-xs text-slate-500">{signoff.title}</div>
        )}
      </div>
    </div>
  );
};
