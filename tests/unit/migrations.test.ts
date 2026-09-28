import { describe, it, expect } from 'vitest';
import { migrateResumeData, CURRENT_SCHEMA_VERSION } from '../../packages/shared/src/resume/migrations.js';

describe('Resume Schema Migrations', () => {
  it('migrates legacy unversioned resume data to schemaVersion 1.0.0', () => {
    const legacyData = {
      name: 'Old User',
      email: 'old@example.com',
      objective: 'Experienced professional looking for new challenges.',
      sections: [
        {
          id: 'exp',
          type: 'experience',
          title: 'Experience',
          visible: true,
          order: 0,
          items: [],
        },
      ],
      style: {
        typography: {
          fontFamilyBody: 'Arial',
        },
      },
    };

    const migrated = migrateResumeData(legacyData);

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.personal.name).toBe('Old User');
    expect(migrated.personal.email).toBe('old@example.com');
    expect(migrated.summary).toBe('Experienced professional looking for new challenges.');
    expect(migrated.style.typography.fontFamilyBody).toBe('Arial');
    // Ensure missing style tokens were safely populated with defaults
    expect(migrated.style.typography.fontSizeBodyPt).toBe(10);
    expect(migrated.style.colors.accent).toBeDefined();
  });

  it('preserves valid schemaVersion 1.0.0 data without modifications', () => {
    const currentData = {
      schemaVersion: '1.0.0',
      personal: {
        name: 'Modern User',
        title: 'Lead Architect',
        email: 'modern@example.com',
        phone: '123',
        location: 'City',
        links: [],
        photo: { url: null, shape: 'circle', size: 100, position: 'right', border: 'none', filters: { brightness: 1, contrast: 1, grayscale: false } },
      },
      summary: 'Summary text',
      sections: [],
      style: {
        typography: {
          fontFamilyName: 'Inter',
          fontFamilyHeadings: 'Inter',
          fontFamilyBody: 'Inter',
          fontSizeNamePt: 28,
          fontSizeHeadingsPt: 14,
          fontSizeBodyPt: 10.5,
          fontSizeSmallPt: 9,
          lineHeight: 1.4,
          paragraphSpacingMm: 3,
          letterSpacingPx: 0,
          sectionSpacingMm: 8,
          bulletIndentMm: 4,
          headingsTransform: 'uppercase',
          headingsBold: true,
          headingsItalic: false,
          headingsUnderline: false,
          textAlignment: 'left',
          bodyJustify: false,
          bulletStyle: 'dot',
          headingStyle: 'bottom-border',
          dateFormat: 'Jan 2024',
        },
        colors: {
          accent: '#1e40af',
          headings: '#0f172a',
          body: '#334155',
          secondary: '#64748b',
          links: '#2563eb',
          background: '#ffffff',
          sidebar: '#f8fafc',
          printSafeMode: false,
          applyAccentToName: false,
          applyAccentToHeadings: true,
          applyAccentToDividers: true,
          applyAccentToIcons: true,
          applyAccentToSkillTags: true,
          applyAccentToLinks: true,
        },
        photo: {
          visible: true,
          url: null,
          shape: 'circle',
          sizePx: 100,
          position: 'right',
          border: 'none',
          borderColor: '#cbd5e1',
          hasShadow: false,
          filterBrightness: 1,
          filterContrast: 1,
          filterGrayscale: false,
        },
        layout: {
          pageSize: 'A4',
          marginTopMm: 15,
          marginBottomMm: 15,
          marginLeftMm: 15,
          marginRightMm: 15,
          linkMargins: true,
          columnRatio: '35/65',
          itemSpacingMm: 3,
          keepSectionsTogether: true,
          showPageBoundaries: true,
          previewZoomPercent: 100,
        },
        sectionOverrides: {},
      },
    };

    const migrated = migrateResumeData(currentData);
    expect(migrated.personal.name).toBe('Modern User');
    expect(migrated.schemaVersion).toBe('1.0.0');
  });
});
