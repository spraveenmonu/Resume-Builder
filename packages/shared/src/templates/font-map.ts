export interface FontDefinition {
  name: string;
  category: 'sans-serif' | 'serif';
  isAtsSafe: boolean;
  docxFallback: string;
  googleFontFamily?: string;
}

export const FONT_MAP: Record<string, FontDefinition> = {
  // ATS-Safe Fonts
  Arial: {
    name: 'Arial',
    category: 'sans-serif',
    isAtsSafe: true,
    docxFallback: 'Arial',
  },
  Calibri: {
    name: 'Calibri',
    category: 'sans-serif',
    isAtsSafe: true,
    docxFallback: 'Calibri',
  },
  Helvetica: {
    name: 'Helvetica',
    category: 'sans-serif',
    isAtsSafe: true,
    docxFallback: 'Arial',
  },
  'Times New Roman': {
    name: 'Times New Roman',
    category: 'serif',
    isAtsSafe: true,
    docxFallback: 'Times New Roman',
  },
  Georgia: {
    name: 'Georgia',
    category: 'serif',
    isAtsSafe: true,
    docxFallback: 'Georgia',
  },
  Garamond: {
    name: 'Garamond',
    category: 'serif',
    isAtsSafe: true,
    docxFallback: 'Garamond',
  },
  Cambria: {
    name: 'Cambria',
    category: 'serif',
    isAtsSafe: true,
    docxFallback: 'Cambria',
  },
  Verdana: {
    name: 'Verdana',
    category: 'sans-serif',
    isAtsSafe: true,
    docxFallback: 'Verdana',
  },

  // Modern Web Fonts (Embedded in PDF, mapped to safe font in DOCX)
  Inter: {
    name: 'Inter',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Calibri',
    googleFontFamily: 'Inter:wght@400;500;600;700',
  },
  Roboto: {
    name: 'Roboto',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Arial',
    googleFontFamily: 'Roboto:wght@400;500;700',
  },
  Lato: {
    name: 'Lato',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Calibri',
    googleFontFamily: 'Lato:wght@400;700',
  },
  'Open Sans': {
    name: 'Open Sans',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Arial',
    googleFontFamily: 'Open+Sans:wght@400;600;700',
  },
  'Source Sans 3': {
    name: 'Source Sans 3',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Calibri',
    googleFontFamily: 'Source+Sans+3:wght@400;600;700',
  },
  Merriweather: {
    name: 'Merriweather',
    category: 'serif',
    isAtsSafe: false,
    docxFallback: 'Georgia',
    googleFontFamily: 'Merriweather:wght@400;700',
  },
  'Playfair Display': {
    name: 'Playfair Display',
    category: 'serif',
    isAtsSafe: false,
    docxFallback: 'Georgia',
    googleFontFamily: 'Playfair+Display:wght@600;700',
  },
  Poppins: {
    name: 'Poppins',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Arial',
    googleFontFamily: 'Poppins:wght@400;500;600;700',
  },
  Montserrat: {
    name: 'Montserrat',
    category: 'sans-serif',
    isAtsSafe: false,
    docxFallback: 'Arial',
    googleFontFamily: 'Montserrat:wght@400;600;700',
  },
};
