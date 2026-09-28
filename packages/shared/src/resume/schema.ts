import { z } from 'zod';
import { resumeStyleSchema } from './style.js';
import { resumeSectionSchema } from './sections.js';

export const personalLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  icon: z.string().optional(),
});

export const personalDetailsSchema = z.object({
  name: z.string().default(''),
  title: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  links: z.array(personalLinkSchema).default([]),
  photo: z.object({
    url: z.string().nullable().default(null),
    shape: z.enum(['circle', 'rounded-square', 'square']).default('circle'),
    size: z.number().default(100),
    position: z.enum(['left', 'center', 'right']).default('right'),
    border: z.enum(['none', 'thin', 'thick']).default('none'),
    filters: z.object({
      brightness: z.number().default(1),
      contrast: z.number().default(1),
      grayscale: z.boolean().default(false),
    }).default({}),
  }).default({}),
});

export const resumeDataSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  personal: personalDetailsSchema.default({}),
  summary: z.string().default(''),
  sections: z.array(resumeSectionSchema).default([]),
  style: resumeStyleSchema.default({}),
});

export type PersonalLink = z.infer<typeof personalLinkSchema>;
export type PersonalDetails = z.infer<typeof personalDetailsSchema>;
export type ResumeData = z.infer<typeof resumeDataSchema>;
