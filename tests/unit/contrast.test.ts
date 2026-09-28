import { describe, it, expect } from 'vitest';
import {
  calculateContrastRatio,
  evaluateContrast,
  getRelativeLuminance,
} from '../../packages/shared/src/utils/contrast.js';

describe('WCAG Contrast Calculator', () => {
  it('calculates relative luminance for pure black and white correctly', () => {
    expect(getRelativeLuminance('#ffffff')).toBeCloseTo(1.0, 2);
    expect(getRelativeLuminance('#000000')).toBeCloseTo(0.0, 2);
  });

  it('calculates maximum contrast ratio (21:1) for black text on white background', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBe(21);
  });

  it('calculates 1:1 contrast ratio for identical colors', () => {
    const ratio = calculateContrastRatio('#ffffff', '#ffffff');
    expect(ratio).toBe(1);
  });

  it('evaluates passing contrast (>= 4.5:1) as optimal', () => {
    const evaluation = evaluateContrast('#1e3a8a', '#ffffff'); // Navy on White
    expect(evaluation.ratio).toBeGreaterThanOrEqual(4.5);
    expect(evaluation.isNormalTextPass).toBe(true);
    expect(evaluation.isPdfExportBlocked).toBe(false);
    expect(evaluation.status).toBe('optimal');
  });

  it('evaluates warning contrast (between 3.0:1 and 4.5:1)', () => {
    const evaluation = evaluateContrast('#888888', '#ffffff'); // Warning mid-gray on White (~3.54:1)
    expect(evaluation.ratio).toBeGreaterThanOrEqual(3.0);
    expect(evaluation.ratio).toBeLessThan(4.5);
    expect(evaluation.isNormalTextPass).toBe(false);
    expect(evaluation.isLargeTextPass).toBe(true);
    expect(evaluation.isPdfExportBlocked).toBe(false);
    expect(evaluation.status).toBe('warning');
  });

  it('blocks PDF export when contrast is critically unreadable (< 3.0:1)', () => {
    const evaluation = evaluateContrast('#cbd5e1', '#ffffff'); // Light gray on White
    expect(evaluation.ratio).toBeLessThan(3.0);
    expect(evaluation.isPdfExportBlocked).toBe(true);
    expect(evaluation.status).toBe('critical');
  });
});
