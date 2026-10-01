// Browser-Based Resume Parser
// Parses JSON, TXT, DOCX (mammoth), and PDF (pdfjs-dist) directly in the client without server uploads.

export interface ParsedResumeResult {
  personal: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    links: { id: string; label: string; url: string }[];
  };
  summary: string;
  sections: Array<{
    id: string;
    title: string;
    type: 'experience' | 'education' | 'skills' | 'custom';
    items: any[];
  }>;
}

export async function parseResumeFile(file: File): Promise<ParsedResumeResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // 1. JSON File
  if (extension === 'json') {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.personal && parsed.sections) {
        return parsed as ParsedResumeResult;
      }
      if (parsed.content?.personal) {
        return parsed.content as ParsedResumeResult;
      }
      // JSON Resume Standard
      if (parsed.basics) {
        return mapJsonResumeStandard(parsed);
      }
    } catch {
      // Fallback to text heuristic parsing if not structured json
      return parseRawText(text);
    }
  }

  // 2. Plain Text File
  if (extension === 'txt') {
    const text = await file.text();
    return parseRawText(text);
  }

  // 3. Word Document (DOCX via lazy-loaded mammoth)
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return parseRawText(result.value);
    } catch (err) {
      console.error('Mammoth extraction error:', err);
      throw new Error('Failed to read DOCX file. Please paste your text or export as PDF/TXT.');
    }
  }

  // 4. PDF File (via lazy-loaded pdfjs-dist)
  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdfjs = await import('pdfjs-dist');
      // Set worker source
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
      }
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      if (!fullText.trim()) {
        throw new Error('PDF appears to be scanned or image-based without selectable text.');
      }

      return parseRawText(fullText);
    } catch (err: any) {
      console.error('PDF.js parsing error:', err);
      throw new Error(err.message || 'Could not extract text from PDF. Ensure it contains selectable text.');
    }
  }

  throw new Error(`Unsupported file format: .${extension}. Please upload a .pdf, .docx, .txt, or .json file.`);
}

export function parseRawText(text: string): ParsedResumeResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedResumeResult = {
    personal: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      links: [],
    },
    summary: '',
    sections: [
      { id: 'sec-exp', title: 'Work Experience', type: 'experience', items: [] },
      { id: 'sec-edu', title: 'Education', type: 'education', items: [] },
      { id: 'sec-skills', title: 'Skills', type: 'skills', items: [] },
    ],
  };

  // 1. Regex Extraction for Email & Phone & Links
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.personal.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) result.personal.phone = phoneMatch[0];

  const linkedInMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedInMatch) {
    result.personal.links.push({
      id: 'link-li',
      label: 'LinkedIn',
      url: linkedInMatch[0].startsWith('http') ? linkedInMatch[0] : `https://${linkedInMatch[0]}`,
    });
  }

  const gitHubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  if (gitHubMatch) {
    result.personal.links.push({
      id: 'link-gh',
      label: 'GitHub',
      url: gitHubMatch[0].startsWith('http') ? gitHubMatch[0] : `https://${gitHubMatch[0]}`,
    });
  }

  // 2. Name & Title heuristics from header lines
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.includes('@') || line.match(/\d{3}/) || line.length > 50) continue;
    if (!result.personal.name) {
      result.personal.name = line;
      headerIndex = i;
      break;
    }
  }

  if (headerIndex + 1 < lines.length && lines[headerIndex + 1].length < 60 && !lines[headerIndex + 1].includes('@')) {
    result.personal.title = lines[headerIndex + 1];
  }

  // 3. Section Segmentation
  const sectionHeaders = [
    { key: 'summary', regex: /^(?:professional\s+)?(?:summary|about(?:\s+me)?|profile|objective)/i },
    { key: 'experience', regex: /^(?:work\s+)?experience|employment(?:\s+history)?|work\s+history/i },
    { key: 'education', regex: /^education|academic(?:\s+background)?|degrees?/i },
    { key: 'skills', regex: /^(?:technical\s+)?skills|core\s+competencies|technologies/i },
  ];

  let currentKey: string | null = null;
  const sectionsContent: Record<string, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
  };

  lines.slice(headerIndex + 2).forEach((line) => {
    const match = sectionHeaders.find((h) => h.regex.test(line));
    if (match) {
      currentKey = match.key;
    } else if (currentKey && sectionsContent[currentKey]) {
      sectionsContent[currentKey].push(line);
    }
  });

  if (sectionsContent.summary.length) {
    result.summary = sectionsContent.summary.join(' ');
  }

  // Parse Experience
  if (sectionsContent.experience.length) {
    const expItems: any[] = [];
    let curExp: any = null;

    sectionsContent.experience.forEach((line) => {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        if (!curExp) {
          curExp = { id: crypto.randomUUID(), title: 'Professional Role', company: 'Company', date: 'Date Range', location: '', desc: '' };
          expItems.push(curExp);
        }
        curExp.desc += (curExp.desc ? '\n' : '') + line;
      } else if (line.match(/\d{4}/) || line.toLowerCase().includes('present')) {
        if (curExp && !curExp.date.includes('20')) {
          curExp.date = line;
        } else {
          curExp = { id: crypto.randomUUID(), title: line, company: 'Company / Organization', date: 'Date Range', location: '', desc: '' };
          expItems.push(curExp);
        }
      } else {
        if (!curExp) {
          curExp = { id: crypto.randomUUID(), title: line, company: 'Company', date: 'Recent', location: '', desc: '' };
          expItems.push(curExp);
        } else if (curExp.company === 'Company') {
          curExp.company = line;
        } else {
          curExp.desc += (curExp.desc ? '\n' : '') + '• ' + line;
        }
      }
    });

    const expSec = result.sections.find((s) => s.type === 'experience');
    if (expSec && expItems.length) expSec.items = expItems.slice(0, 6);
  }

  // Parse Education
  if (sectionsContent.education.length) {
    const eduSec = result.sections.find((s) => s.type === 'education');
    if (eduSec) {
      eduSec.items = [
        {
          id: crypto.randomUUID(),
          degree: sectionsContent.education[0] || 'Degree / Qualification',
          school: sectionsContent.education[1] || 'University / Institution',
          date: sectionsContent.education.find((l) => l.match(/\d{4}/)) || '',
          gpa: '',
          desc: sectionsContent.education.slice(2).join(', '),
        },
      ];
    }
  }

  // Parse Skills
  if (sectionsContent.skills.length) {
    const allSkills = sectionsContent.skills
      .join(',')
      .split(/[,•|·]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 35);

    const skillsSec = result.sections.find((s) => s.type === 'skills');
    if (skillsSec && allSkills.length) {
      skillsSec.items = [
        {
          id: crypto.randomUUID(),
          category: 'Key Competencies',
          items: allSkills.slice(0, 16),
        },
      ];
    }
  }

  return result;
}

function mapJsonResumeStandard(json: any): ParsedResumeResult {
  const b = json.basics || {};
  return {
    personal: {
      name: b.name || 'Candidate Name',
      title: b.label || 'Professional Title',
      email: b.email || '',
      phone: b.phone || '',
      location: b.location ? `${b.location.city || ''}, ${b.location.region || ''}` : '',
      links: Array.isArray(b.profiles)
        ? b.profiles.map((p: any) => ({
            id: crypto.randomUUID(),
            label: p.network || 'Link',
            url: p.url || '',
          }))
        : [],
    },
    summary: b.summary || '',
    sections: [
      {
        id: 'sec-exp',
        title: 'Work Experience',
        type: 'experience',
        items: Array.isArray(json.work)
          ? json.work.map((w: any) => ({
              id: crypto.randomUUID(),
              title: w.position || 'Role',
              company: w.name || 'Company',
              date: `${w.startDate || ''} — ${w.endDate || 'Present'}`,
              location: w.location || '',
              desc: [w.summary, ...(Array.isArray(w.highlights) ? w.highlights.map((h: string) => `• ${h}`) : [])]
                .filter(Boolean)
                .join('\n'),
            }))
          : [],
      },
      {
        id: 'sec-edu',
        title: 'Education',
        type: 'education',
        items: Array.isArray(json.education)
          ? json.education.map((e: any) => ({
              id: crypto.randomUUID(),
              degree: e.studyType ? `${e.studyType} in ${e.area || ''}` : e.area || 'Degree',
              school: e.institution || 'University',
              date: `${e.startDate || ''} — ${e.endDate || ''}`,
              gpa: e.score ? `GPA: ${e.score}` : '',
              desc: Array.isArray(e.courses) ? e.courses.join(', ') : '',
            }))
          : [],
      },
      {
        id: 'sec-skills',
        title: 'Skills',
        type: 'skills',
        items: Array.isArray(json.skills)
          ? json.skills.map((s: any) => ({
              id: crypto.randomUUID(),
              category: s.name || 'Skills',
              items: Array.isArray(s.keywords) ? s.keywords : [s.name],
            }))
          : [],
      },
    ],
  };
}
