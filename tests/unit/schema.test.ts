import { describe, it, expect } from 'vitest';
import { resumeStyleSchema } from '../../packages/shared/src/resume/style.js';
import { DEFAULT_STYLE } from '../../packages/shared/src/resume/defaults.js';

describe('Resume Style Zod Schema Validation', () => {
  it('validates default style object successfully', () => {
    const result = resumeStyleSchema.safeParse(DEFAULT_STYLE);
    expect(result.success).toBe(true);
  });

  it('rejects body font size under 9 pt', () => {
    const invalid = {
      ...DEFAULT_STYLE,
      typography: {
        ...DEFAULT_STYLE.typography,
        fontSizeBodyPt: 8, // below minimum 9 pt
      },
    };
    const result = resumeStyleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects body font size over 12 pt', () => {
    const invalid = {
      ...DEFAULT_STYLE,
      typography: {
        ...DEFAULT_STYLE.typography,
        fontSizeBodyPt: 14, // above maximum 12 pt
      },
    };
    const result = resumeStyleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects name font size over 40 pt or under 20 pt', () => {
    const invalidHigh = {
      ...DEFAULT_STYLE,
      typography: { ...DEFAULT_STYLE.typography, fontSizeNamePt: 50 },
    };
    const invalidLow = {
      ...DEFAULT_STYLE,
      typography: { ...DEFAULT_STYLE.typography, fontSizeNamePt: 15 },
    };
    expect(resumeStyleSchema.safeParse(invalidHigh).success).toBe(false);
    expect(resumeStyleSchema.safeParse(invalidLow).success).toBe(false);
  });

  it('rejects unsupported font families', () => {
    const invalid = {
      ...DEFAULT_STYLE,
      typography: {
        ...DEFAULT_STYLE.typography,
        fontFamilyBody: 'Comic Sans MS' as any,
      },
    };
    const result = resumeStyleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid color hex codes', () => {
    const invalid = {
      ...DEFAULT_STYLE,
      colors: {
        ...DEFAULT_STYLE.colors,
        accent: 'rgb(255,0,0)', // must be valid hex format
      },
    };
    const result = resumeStyleSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects margins outside 10-30 mm range', () => {
    const invalidLow = {
      ...DEFAULT_STYLE,
      layout: { ...DEFAULT_STYLE.layout, marginTopMm: 5 },
    };
    const invalidHigh = {
      ...DEFAULT_STYLE,
      layout: { ...DEFAULT_STYLE.layout, marginTopMm: 45 },
    };
    expect(resumeStyleSchema.safeParse(invalidLow).success).toBe(false);
    expect(resumeStyleSchema.safeParse(invalidHigh).success).toBe(false);
  });

  it('rejects photo size outside 60-200 px', () => {
    const invalidLow = {
      ...DEFAULT_STYLE,
      photo: { ...DEFAULT_STYLE.photo, sizePx: 30 },
    };
    const invalidHigh = {
      ...DEFAULT_STYLE,
      photo: { ...DEFAULT_STYLE.photo, sizePx: 250 },
    };
    expect(resumeStyleSchema.safeParse(invalidLow).success).toBe(false);
    expect(resumeStyleSchema.safeParse(invalidHigh).success).toBe(false);
  });
});
