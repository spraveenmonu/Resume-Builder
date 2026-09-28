import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';
import { DEFAULT_RESUME_DATA, DEFAULT_STYLE, COLOR_PALETTES } from '@careercraft/shared';

const prisma = new PrismaClient();

const TEMPLATES = [
  // ATS-Safe (Single-column, text-clean)
  {
    slug: 'classic-professional',
    name: 'Classic Professional',
    category: 'ats',
    description: 'Clean single-column layout optimized for high ATS parser accuracy with traditional typography.',
    previewImage: '/templates/classic-professional.png',
    atsSafe: true,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 1,
  },
  {
    slug: 'chronological',
    name: 'Chronological',
    category: 'ats',
    description: 'Emphasizes progressive career trajectory and deep work history with clear milestone grouping.',
    previewImage: '/templates/chronological.png',
    atsSafe: true,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 2,
  },
  {
    slug: 'combination',
    name: 'Combination',
    category: 'ats',
    description: 'Balances in-depth functional core competencies at the top with chronological employment below.',
    previewImage: '/templates/combination.png',
    atsSafe: true,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 3,
  },
  {
    slug: 'internship-fresher',
    name: 'Internship / Fresher',
    category: 'ats',
    description: 'Prioritizes education, academic projects, leadership activities, and early career certifications.',
    previewImage: '/templates/internship-fresher.png',
    atsSafe: true,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 4,
  },
  {
    slug: 'plain-text',
    name: 'Plain Text',
    category: 'ats',
    description: 'Zero graphic embellishment. Pure hierarchical typography guaranteed to score 100% on legacy parsers.',
    previewImage: '/templates/plain-text.png',
    atsSafe: true,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 5,
  },

  // Modern
  {
    slug: 'minimal-tech',
    name: 'Minimal Tech',
    category: 'modern',
    description: 'Crisp typography and subtle accent dividers tailored for software developers and systems architects.',
    previewImage: '/templates/minimal-tech.png',
    atsSafe: false,
    supportsPhoto: true,
    columns: 1,
    sortOrder: 6,
  },
  {
    slug: 'two-column-skills',
    name: 'Two-Column Skills',
    category: 'modern',
    description: 'Distinct sidebar for organized skill stacks, credentials, languages, and contact badges.',
    previewImage: '/templates/two-column-skills.png',
    atsSafe: false,
    supportsPhoto: true,
    columns: 2,
    sortOrder: 7,
  },
  {
    slug: 'executive',
    name: 'Executive',
    category: 'modern',
    description: 'Prestigious serif accents and strategic spacing designed for VP, Director, and C-Suite profiles.',
    previewImage: '/templates/executive.png',
    atsSafe: false,
    supportsPhoto: true,
    columns: 1,
    sortOrder: 8,
  },
  {
    slug: 'compact-one-page',
    name: 'Compact One-Page',
    category: 'modern',
    description: 'High information density layout engineered to fit maximum career achievements onto a single page.',
    previewImage: '/templates/compact-one-page.png',
    atsSafe: false,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 9,
  },

  // Specialized
  {
    slug: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'specialized',
    description: 'Vibrant accent cards and project showcase links for UI/UX designers, copywriters, and marketers.',
    previewImage: '/templates/creative-portfolio.png',
    atsSafe: false,
    supportsPhoto: true,
    columns: 2,
    sortOrder: 10,
  },
  {
    slug: 'academic-cv',
    name: 'Academic CV',
    category: 'specialized',
    description: 'Multi-page structured format with dedicated sections for publications, grants, conferences, and teaching.',
    previewImage: '/templates/academic-cv.png',
    atsSafe: false,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 11,
  },
  {
    slug: 'functional',
    name: 'Functional',
    category: 'specialized',
    description: 'Skill-cluster focused layout for career pivots, industry transitions, and returning professionals.',
    previewImage: '/templates/functional.png',
    atsSafe: false,
    supportsPhoto: false,
    columns: 1,
    sortOrder: 12,
  },
  {
    slug: 'international',
    name: 'International',
    category: 'specialized',
    description: 'European/Global standard format supporting formal photo framing, nationality, and language proficiency bars.',
    previewImage: '/templates/international.png',
    atsSafe: false,
    supportsPhoto: true,
    columns: 2,
    sortOrder: 13,
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Templates
  for (const t of TEMPLATES) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        category: t.category,
        description: t.description,
        previewImage: t.previewImage,
        atsSafe: t.atsSafe,
        supportsPhoto: t.supportsPhoto,
        columns: t.columns,
        sortOrder: t.sortOrder,
        defaultStyle: DEFAULT_STYLE as any,
        sampleData: DEFAULT_RESUME_DATA as any,
        layoutConfig: { columnRatio: '35/65', marginsMm: 15 },
      },
      create: {
        slug: t.slug,
        name: t.name,
        category: t.category,
        description: t.description,
        previewImage: t.previewImage,
        atsSafe: t.atsSafe,
        supportsPhoto: t.supportsPhoto,
        columns: t.columns,
        sortOrder: t.sortOrder,
        defaultStyle: DEFAULT_STYLE as any,
        sampleData: DEFAULT_RESUME_DATA as any,
        layoutConfig: { columnRatio: '35/65', marginsMm: 15 },
      },
    });
  }
  console.log(`✅ Seeded ${TEMPLATES.length} templates`);

  // 2. Seed System Style Presets
  for (const [key, palette] of Object.entries(COLOR_PALETTES)) {
    const presetName = palette.name;
    const existing = await prisma.stylePreset.findFirst({
      where: { name: presetName, isSystem: true },
    });

    const stylePayload = {
      ...DEFAULT_STYLE,
      colors: {
        ...DEFAULT_STYLE.colors,
        accent: palette.accent,
        headings: palette.headings,
        body: palette.body,
        secondary: palette.secondary,
        links: palette.links,
        background: palette.background,
        sidebar: palette.sidebar,
      },
    };

    if (!existing) {
      await prisma.stylePreset.create({
        data: {
          name: presetName,
          category: 'color-palette',
          isSystem: true,
          style: stylePayload as any,
        },
      });
    }
  }
  console.log('✅ Seeded system style presets');

  // 3. Seed Admin User
  const adminEmail = 'admin@careercraft.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash('AdminPass123!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Admin',
        passwordHash,
        role: Role.ADMIN,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ Seeded Admin User: ${adminEmail} (Password: AdminPass123!)`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
