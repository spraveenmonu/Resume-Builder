import { describe, it, expect } from 'vitest';
import {
  ptToHalfPoints,
  mmToDxa,
  pxToEmu,
  mmToPt,
  sanitizeHexForDocx,
} from '../../packages/shared/src/utils/units.js';

describe('Unit Conversion Utilities', () => {
  it('converts typographic points to Word half-points accurately (1 pt = 2 half-points)', () => {
    expect(ptToHalfPoints(12)).toBe(24);
    expect(ptToHalfPoints(10.5)).toBe(21);
    expect(ptToHalfPoints(28)).toBe(56);
  });

  it('converts millimeters to twentieths of a point (DXA) for DOCX margins', () => {
    // 15mm is standard ~850 dxa
    const dxa = mmToDxa(15);
    expect(dxa).toBe(850);
  });

  it('converts pixel dimensions to EMUs for DOCX image embeddings (96 DPI standard)', () => {
    // 100px photo * 9525 = 952,500 EMUs
    expect(pxToEmu(100)).toBe(952500);
    expect(pxToEmu(80)).toBe(762000);
  });

  it('converts millimeters to print points (1 mm ≈ 2.83465 pt)', () => {
    expect(mmToPt(10)).toBeCloseTo(28.35, 1);
  });

  it('sanitizes CSS hex codes for OpenXML DOCX color attributes', () => {
    expect(sanitizeHexForDocx('#1e3a8a')).toBe('1e3a8a');
    expect(sanitizeHexForDocx(' #ff0000 ')).toBe('ff0000');
  });
});
