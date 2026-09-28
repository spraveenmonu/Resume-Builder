import { z } from 'zod';

export const ATS_SAFE_FONTS = [
  'Arial',
  'Calibri',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Cambria',
  'Verdana',
] as const;

export const MODERN_FONTS = [
  'Inter',
  'Roboto',
  'Lato',
  'Open Sans',
  'Source Sans 3',
  'Merriweather',
  'Playfair Display',
  'Poppins',
  'Montserrat',
] as const;

export const ALL_FONTS = [...ATS_SAFE_FONTS, ...MODERN_FONTS] as const;

export const typographySchema = z.object({
  fontFamilyName: z.enum(ALL_FONTS).default('Inter'),
  fontFamilyHeadings: z.enum(ALL_FONTS).default('Inter'),
  fontFamilyBody: z.enum(ALL_FONTS).default('Inter'),
  
  fontSizeNamePt: z.number().min(20).max(40).default(28),
  fontSizeHeadingsPt: z.number().min(11).max(18).default(14),
  fontSizeBodyPt: z.number().min(9).max(12).default(10.5),
  fontSizeSmallPt: z.number().min(8).max(11).default(9),
  
  lineHeight: z.number().min(1.0).max(2.0).default(1.4),
  paragraphSpacingMm: z.number().min(0).max(10).default(3),
  letterSpacingPx: z.number().min(-0.5).max(2).default(0),
  sectionSpacingMm: z.number().min(2).max(20).default(8),
  bulletIndentMm: z.number().min(0).max(15).default(4),
  
  headingsTransform: z.enum(['uppercase', 'capitalize', 'normal']).default('uppercase'),
  headingsBold: z.boolean().default(true),
  headingsItalic: z.boolean().default(false),
  headingsUnderline: z.boolean().default(false),
  
  textAlignment: z.enum(['left', 'center', 'right']).default('left'),
  bodyJustify: z.boolean().default(false),
  
  bulletStyle: z.enum(['dot', 'dash', 'square', 'arrow', 'none']).default('dot'),
  headingStyle: z.enum(['plain', 'underline', 'bottom-border', 'left-bar', 'background-band']).default('bottom-border'),
  dateFormat: z.enum(['Jan 2024', '01/2024', '2024', 'January 2024']).default('Jan 2024'),
});

export const colorsSchema = z.object({
  accent: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#1e40af'),
  headings: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#0f172a'),
  body: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#334155'),
  secondary: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#64748b'),
  links: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#2563eb'),
  background: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#ffffff'),
  sidebar: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be valid hex color').default('#f8fafc'),
  
  printSafeMode: z.boolean().default(false),
  
  applyAccentToName: z.boolean().default(false),
  applyAccentToHeadings: z.boolean().default(true),
  applyAccentToDividers: z.boolean().default(true),
  applyAccentToIcons: z.boolean().default(true),
  applyAccentToSkillTags: z.boolean().default(true),
  applyAccentToLinks: z.boolean().default(true),
});

export const photoSchema = z.object({
  visible: z.boolean().default(true),
  url: z.string().nullable().default(null),
  shape: z.enum(['circle', 'rounded-square', 'square']).default('circle'),
  sizePx: z.number().min(60).max(200).default(100),
  position: z.enum(['left', 'center', 'right']).default('right'),
  border: z.enum(['none', 'thin', 'thick']).default('none'),
  borderColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).default('#cbd5e1'),
  hasShadow: z.boolean().default(false),
  filterBrightness: z.number().min(0.5).max(1.5).default(1.0),
  filterContrast: z.number().min(0.5).max(1.5).default(1.0),
  filterGrayscale: z.boolean().default(false),
});

export const layoutSchema = z.object({
  pageSize: z.enum(['A4', 'LETTER']).default('A4'),
  marginTopMm: z.number().min(10).max(30).default(15),
  marginBottomMm: z.number().min(10).max(30).default(15),
  marginLeftMm: z.number().min(10).max(30).default(15),
  marginRightMm: z.number().min(10).max(30).default(15),
  linkMargins: z.boolean().default(true),
  
  columnRatio: z.enum(['30/70', '35/65', '40/60']).default('35/65'),
  itemSpacingMm: z.number().min(1).max(10).default(3),
  
  keepSectionsTogether: z.boolean().default(true),
  showPageBoundaries: z.boolean().default(true),
  previewZoomPercent: z.number().min(50).max(200).default(100),
});

export const sectionOverrideSchema = z.object({
  title: z.string().optional(),
  headingStyle: z.enum(['plain', 'underline', 'bottom-border', 'left-bar', 'background-band']).optional(),
  visible: z.boolean().optional(),
  skillsDisplay: z.enum(['comma-list', 'bullet-list', 'grouped', 'tag-pills', 'skill-bars']).optional(),
});

export const resumeStyleSchema = z.object({
  typography: typographySchema.default({}),
  colors: colorsSchema.default({}),
  photo: photoSchema.default({}),
  layout: layoutSchema.default({}),
  sectionOverrides: z.record(z.string(), sectionOverrideSchema).default({}),
});

export type TypographyStyle = z.infer<typeof typographySchema>;
export type ColorsStyle = z.infer<typeof colorsSchema>;
export type PhotoStyle = z.infer<typeof photoSchema>;
export type LayoutStyle = z.infer<typeof layoutSchema>;
export type SectionOverride = z.infer<typeof sectionOverrideSchema>;
export type ResumeStyle = z.infer<typeof resumeStyleSchema>;
