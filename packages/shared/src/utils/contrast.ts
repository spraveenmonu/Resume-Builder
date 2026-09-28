/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio Calculator
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getChannelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const R = getChannelLuminance(r);
  const G = getChannelLuminance(g);
  const B = getChannelLuminance(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function calculateContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getRelativeLuminance(foregroundHex);
  const lum2 = getRelativeLuminance(backgroundHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  return Math.round(ratio * 100) / 100;
}

export interface ContrastEvaluation {
  ratio: number;
  isNormalTextPass: boolean; // >= 4.5:1
  isLargeTextPass: boolean;  // >= 3.0:1
  isPdfExportBlocked: boolean; // < 3.0:1
  status: 'optimal' | 'warning' | 'critical';
}

export function evaluateContrast(foregroundHex: string, backgroundHex: string): ContrastEvaluation {
  const ratio = calculateContrastRatio(foregroundHex, backgroundHex);
  const isNormalTextPass = ratio >= 4.5;
  const isLargeTextPass = ratio >= 3.0;
  const isPdfExportBlocked = ratio < 3.0;

  let status: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (!isNormalTextPass && isLargeTextPass) {
    status = 'warning';
  } else if (!isLargeTextPass) {
    status = 'critical';
  }

  return {
    ratio,
    isNormalTextPass,
    isLargeTextPass,
    isPdfExportBlocked,
    status,
  };
}
