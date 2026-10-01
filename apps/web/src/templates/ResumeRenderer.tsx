import React from 'react';
import { RESUME_TEMPLATES } from './registry.js';

export interface ResumeRendererProps {
  content: any;
  styles?: any;
  templateId?: string;
  className?: string;
}

export const ResumeRenderer: React.FC<ResumeRendererProps> = ({
  content,
  styles = {},
  templateId = 'michael',
  className = '',
}) => {
  const tpl = RESUME_TEMPLATES.find((t) => t.id === templateId) || RESUME_TEMPLATES[0];
  const isCyber = tpl.isCyberpunk;

  // Resolved Styles
  const fontFamily = styles.fontFamily || tpl.font || 'Inter';
  const fontSizeName = `${styles.fontSizeNamePt || 24}pt`;
  const fontSizeHeadings = `${styles.fontSizeHeadingsPt || 12.5}pt`;
  const fontSizeBody = `${styles.fontSizeBodyPt || 9.5}pt`;
  const lineHeight = styles.lineHeight || 1.45;
  const marginMm = styles.marginMm || 15;
  const accentColor = styles.accentColor || tpl.color || '#00f0ff';
  const headingsColor = isCyber ? (styles.headingsColor || '#00f0ff') : (styles.headingsColor || '#0f172a');
  const bodyColor = isCyber ? (styles.bodyColor || '#e2e8f0') : (styles.bodyColor || '#334155');
  const backgroundColor = isCyber ? '#0a0b1e' : (styles.backgroundColor || '#ffffff');

  const personal = content?.personal || {};
  const photo = personal.photo || {};
  const summary = content?.summary || '';
  const sections = content?.sections || [];

  // Helper for photo shape
  const getPhotoShapeClass = () => {
    if (photo.shape === 'square') return 'rounded-none';
    if (photo.shape === 'rounded-square') return 'rounded-xl';
    return 'rounded-full';
  };

  const isTwoColumn = tpl.columns === 2;

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

      {/* Header Section */}
      <header className={`flex items-start justify-between gap-6 pb-5 mb-5 border-b ${isCyber ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="flex-1">
          <h1
            className="font-extrabold tracking-tight"
            style={{ fontSize: fontSizeName, color: headingsColor, lineHeight: 1.15 }}
          >
            {personal.name || 'Candidate Name'}
          </h1>
          <p
            className="font-semibold mt-1 tracking-wide"
            style={{ fontSize: `calc(${fontSizeBody} * 1.15)`, color: accentColor }}
          >
            {personal.title || 'Professional Title'}
          </p>

          {/* Contact Strip */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[9pt] text-slate-500 font-sans">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>• {personal.phone}</span>}
            {personal.location && <span>• {personal.location}</span>}
            {personal.links?.map((link: any) => (
              <span key={link.id}>
                • <a href={link.url} target="_blank" rel="noreferrer" className="underline hover:text-black">{link.label}</a>
              </span>
            ))}
          </div>
        </div>

        {/* Profile Photo if present */}
        {photo.url && (
          <div className="flex-shrink-0">
            <img
              src={photo.url}
              alt={personal.name || 'Profile'}
              className={`object-cover border-2 shadow-sm ${getPhotoShapeClass()}`}
              style={{
                width: `${photo.size || 90}px`,
                height: `${photo.size || 90}px`,
                borderColor: accentColor,
              }}
            />
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {summary && (
        <section className="mb-5">
          <h2
            className="font-bold uppercase tracking-wider mb-2 pb-1 border-b"
            style={{ fontSize: fontSizeHeadings, color: headingsColor, borderColor: isCyber ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}
          >
            Professional Summary
          </h2>
          <p className="leading-relaxed" style={{ fontSize: fontSizeBody }}>
            {summary}
          </p>
        </section>
      )}

      {/* Main Body: Single or Two-Column */}
      <div className={isTwoColumn ? 'grid grid-cols-12 gap-6' : 'space-y-5'}>
        {/* If Two-column, Experience goes to Col 1-7, Skills/Education to Col 8-12 */}
        <div className={isTwoColumn ? 'col-span-8 space-y-5' : 'space-y-5'}>
          {sections
            .filter((sec: any) => !isTwoColumn || sec.type === 'experience' || sec.type === 'custom')
            .map((section: any) => (
              <section key={section.id} className="space-y-3">
                <h2
                  className="font-bold uppercase tracking-wider pb-1 border-b"
                  style={{
                    fontSize: fontSizeHeadings,
                    color: headingsColor,
                    borderColor: isCyber ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                  }}
                >
                  {section.title}
                </h2>

                {section.type === 'experience' && (
                  <div className="space-y-3.5">
                    {section.items?.map((item: any) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-bold text-slate-800" style={{ color: isCyber ? '#fff' : '#0f172a' }}>
                            {item.title}
                          </h3>
                          <span className="text-[8.5pt] font-medium text-slate-500 whitespace-nowrap">
                            {item.date}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9pt] font-semibold" style={{ color: accentColor }}>
                          <span>{item.company}</span>
                          {item.location && <span className="text-slate-500 font-normal">{item.location}</span>}
                        </div>
                        {item.desc && (
                          <div className="text-[9pt] whitespace-pre-line leading-relaxed text-slate-600 mt-1" style={{ color: bodyColor }}>
                            {item.desc}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'education' && (
                  <div className="space-y-3">
                    {section.items?.map((item: any) => (
                      <div key={item.id} className="space-y-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-bold" style={{ color: isCyber ? '#fff' : '#0f172a' }}>
                            {item.degree}
                          </h3>
                          <span className="text-[8.5pt] text-slate-500 whitespace-nowrap">{item.date}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9pt]" style={{ color: accentColor }}>
                          <span>{item.school}</span>
                          {item.gpa && <span className="text-slate-500 font-normal">{item.gpa}</span>}
                        </div>
                        {item.desc && <p className="text-[8.5pt] text-slate-500 mt-0.5">{item.desc}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {section.type === 'skills' && (
                  <div className="space-y-2">
                    {section.items?.map((item: any) => (
                      <div key={item.id}>
                        <div className="font-bold text-[9pt] mb-1" style={{ color: headingsColor }}>
                          {item.category}:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.items?.map((skill: string, sIdx: number) => (
                            <span
                              key={sIdx}
                              className="text-[8.5pt] px-2 py-0.5 rounded border"
                              style={{
                                borderColor: isCyber ? 'rgba(0,240,255,0.3)' : '#e2e8f0',
                                backgroundColor: isCyber ? 'rgba(0,240,255,0.05)' : '#f8fafc',
                                color: bodyColor,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
        </div>

        {/* Second Column (if Two-Column layout) */}
        {isTwoColumn && (
          <div className="col-span-4 space-y-5">
            {sections
              .filter((sec: any) => sec.type === 'skills' || sec.type === 'education')
              .map((section: any) => (
                <section key={section.id} className="space-y-3">
                  <h2
                    className="font-bold uppercase tracking-wider pb-1 border-b"
                    style={{
                      fontSize: fontSizeHeadings,
                      color: headingsColor,
                      borderColor: isCyber ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                    }}
                  >
                    {section.title}
                  </h2>

                  {section.type === 'education' && (
                    <div className="space-y-3">
                      {section.items?.map((item: any) => (
                        <div key={item.id} className="space-y-0.5">
                          <h3 className="font-bold text-[9pt]" style={{ color: isCyber ? '#fff' : '#0f172a' }}>
                            {item.degree}
                          </h3>
                          <div className="text-[8.5pt]" style={{ color: accentColor }}>{item.school}</div>
                          <div className="text-[8pt] text-slate-500">{item.date}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.type === 'skills' && (
                    <div className="space-y-2.5">
                      {section.items?.map((item: any) => (
                        <div key={item.id}>
                          <div className="font-bold text-[8.5pt] mb-1" style={{ color: headingsColor }}>
                            {item.category}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.items?.map((skill: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="text-[8pt] px-1.5 py-0.5 rounded border"
                                style={{
                                  borderColor: isCyber ? 'rgba(0,240,255,0.3)' : '#e2e8f0',
                                  backgroundColor: isCyber ? 'rgba(0,240,255,0.05)' : '#f8fafc',
                                  color: bodyColor,
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
