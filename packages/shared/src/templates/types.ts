export type TemplateCategory = 'ats' | 'modern' | 'specialized';

export interface TemplateMetadata {
  id: string;
  slug: string;
  name: string;
  category: TemplateCategory;
  description: string;
  bestFor: string;
  previewImage: string;
  atsSafe: boolean;
  supportsPhoto: boolean;
  columns: 1 | 2;
  recommendedRole?: string;
}
