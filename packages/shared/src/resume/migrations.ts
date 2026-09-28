import { ResumeData, resumeDataSchema } from './schema.js';
import { DEFAULT_STYLE } from './defaults.js';

export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Migration registry mapping legacy versions to transformers.
 */
type MigrationFn = (oldData: any) => any;

const migrations: Record<string, MigrationFn> = {
  // Legacy pre-schemaVersion format (e.g. 0.9.0 or unversioned)
  '0.9.0': (oldData: any): any => {
    return {
      schemaVersion: '1.0.0',
      personal: {
        name: oldData?.name || oldData?.personal?.name || '',
        title: oldData?.title || oldData?.personal?.title || '',
        email: oldData?.email || oldData?.personal?.email || '',
        phone: oldData?.phone || oldData?.personal?.phone || '',
        location: oldData?.location || oldData?.personal?.location || '',
        links: oldData?.links || oldData?.personal?.links || [],
        photo: oldData?.photo || oldData?.personal?.photo || { url: null, shape: 'circle', size: 100, position: 'right' },
      },
      summary: oldData?.summary || oldData?.objective || '',
      sections: Array.isArray(oldData?.sections) ? oldData.sections : [],
      style: {
        ...DEFAULT_STYLE,
        ...(oldData?.style || {}),
        typography: {
          ...DEFAULT_STYLE.typography,
          ...(oldData?.style?.typography || {}),
        },
        colors: {
          ...DEFAULT_STYLE.colors,
          ...(oldData?.style?.colors || {}),
        },
        photo: {
          ...DEFAULT_STYLE.photo,
          ...(oldData?.style?.photo || {}),
        },
        layout: {
          ...DEFAULT_STYLE.layout,
          ...(oldData?.style?.layout || {}),
        },
      },
    };
  },
};

/**
 * Migrates any raw resume object to the current schemaVersion safely.
 */
export function migrateResumeData(raw: unknown): ResumeData {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid resume data payload');
  }

  let current = { ...(raw as Record<string, any>) };

  if (!current.schemaVersion) {
    current = migrations['0.9.0'](current);
  }

  // Parse and validate against the current Zod schema
  const parsed = resumeDataSchema.safeParse(current);
  if (!parsed.success) {
    // If soft validation errors occur, fill in defaults for missing fields
    const filledWithDefaults = {
      ...current,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      personal: { ...DEFAULT_STYLE, ...(current.personal || {}) },
      style: { ...DEFAULT_STYLE, ...(current.style || {}) },
    };
    return resumeDataSchema.parse(filledWithDefaults);
  }

  return parsed.data;
}
