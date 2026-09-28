import { z } from 'zod';

export const experienceItemSchema = z.object({
  id: z.string(),
  company: z.string().default(''),
  position: z.string().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().default(''),
  endDate: z.string().optional().default(''),
  isCurrent: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
});

export const educationItemSchema = z.object({
  id: z.string(),
  institution: z.string().default(''),
  degree: z.string().default(''),
  fieldOfStudy: z.string().optional().default(''),
  location: z.string().optional().default(''),
  startDate: z.string().default(''),
  endDate: z.string().optional().default(''),
  gpa: z.string().optional().default(''),
  bullets: z.array(z.string()).default([]),
});

export const skillGroupSchema = z.object({
  id: z.string(),
  category: z.string().default(''),
  skills: z.array(z.object({
    id: z.string(),
    name: z.string(),
    level: z.number().min(1).max(5).optional(), // for skill bars
  })).default([]),
});

export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  role: z.string().optional().default(''),
  url: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  technologies: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
});

export const certificationItemSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  issuer: z.string().default(''),
  issueDate: z.string().default(''),
  expiryDate: z.string().optional().default(''),
  credentialUrl: z.string().optional().default(''),
});

export const languageItemSchema = z.object({
  id: z.string(),
  language: z.string().default(''),
  proficiency: z.enum(['Native', 'Fluent', 'Proficient', 'Intermediate', 'Basic']).default('Fluent'),
});

export const customItemSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  subtitle: z.string().optional().default(''),
  date: z.string().optional().default(''),
  description: z.string().optional().default(''),
  bullets: z.array(z.string()).default([]),
});

export const sectionTypeSchema = z.enum([
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'internships',
  'volunteering',
  'languages',
  'interests',
  'publications',
  'awards',
  'references',
  'custom',
]);

export const resumeSectionSchema = z.object({
  id: z.string(),
  type: sectionTypeSchema,
  title: z.string(),
  visible: z.boolean().default(true),
  order: z.number().default(0),
  styleOverride: z.record(z.any()).optional(),
  items: z.array(z.any()).default([]),
});

export type SectionType = z.infer<typeof sectionTypeSchema>;
export type ResumeSection = z.infer<typeof resumeSectionSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type CustomItem = z.infer<typeof customItemSchema>;
