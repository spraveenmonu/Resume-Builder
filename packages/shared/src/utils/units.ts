/**
 * Unit conversion utilities for print (CSS pt, mm), screen (px), and DOCX (half-points, dxa, EMUs).
 */

export function ptToHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

export function mmToDxa(mm: number): number {
  return Math.round(mm * 56.6929);
}

export function pxToEmu(px: number): number {
  // 96 DPI standard: 1 inch = 914400 EMUs. 914400 / 96 = 9525 EMUs per pixel.
  return Math.round(px * 9525);
}

export function mmToPt(mm: number): number {
  return mm * 2.83465;
}

export function ptToPx(pt: number): number {
  return pt * (96 / 72);
}

export function sanitizeHexForDocx(hex: string): string {
  return hex.replace('#', '').trim();
}
