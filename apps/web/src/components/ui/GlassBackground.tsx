import React from 'react';

export const GlassBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#05060f]"
      aria-hidden="true"
    >
      {/* Perspective cyber-grid */}
      <div className="absolute inset-0 cyber-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]" />

      {/* Floating blurred neon blobs - animate transform/opacity only */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#00f0ff]/15 blur-[120px] animate-float pointer-events-none" 
        style={{ animationDuration: '14s' }}
      />
      <div 
        className="absolute top-[35%] -right-[15%] w-[600px] h-[600px] rounded-full bg-[#ff2bd6]/12 blur-[140px] animate-float pointer-events-none" 
        style={{ animationDuration: '18s', animationDelay: '-4s' }}
      />
      <div 
        className="absolute -bottom-[15%] left-[25%] w-[550px] h-[550px] rounded-full bg-[#8b5cf6]/15 blur-[130px] animate-float pointer-events-none" 
        style={{ animationDuration: '16s', animationDelay: '-8s' }}
      />

      {/* Subtle top scanline / vignette accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00f0ff]/[0.02] via-transparent to-[#05060f]/80 pointer-events-none" />
    </div>
  );
};
