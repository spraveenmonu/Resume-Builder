import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase/supabaseClient.js';

export interface DocumentItem {
  id: string;
  user_id?: string;
  type: 'resume' | 'cover_letter';
  title: string;
  template_id: string;
  content: any;
  styles: any;
  share_token?: string | null;
  is_shared?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentState {
  currentDocument: DocumentItem | null;
  documentsList: DocumentItem[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  history: DocumentItem[];
  historyIndex: number;
  isLoading: boolean;

  // Actions
  setCurrentDocument: (doc: DocumentItem | null) => void;
  updateContent: (updater: (prevContent: any) => any) => void;
  updateStyles: (updater: (prevStyles: any) => any) => void;
  updateTitle: (title: string) => void;
  setTemplateId: (templateId: string) => void;
  createNewDocument: (type: 'resume' | 'cover_letter', templateId: string, title?: string) => DocumentItem;
  fetchDocuments: () => Promise<void>;
  saveCurrentDocument: () => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  duplicateDocument: (id: string) => Promise<DocumentItem>;
  generateShareToken: (id: string) => Promise<string>;
  revokeShareToken: (id: string) => Promise<void>;
  undo: () => void;
  redo: () => void;
}

export const DEFAULT_RESUME_CONTENT = {
  personal: {
    name: 'Michael Johnson',
    title: 'Lead Cloud Architect & Staff Engineer',
    email: 'michael.johnson@techcorp.io',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    links: [
      { id: '1', label: 'GitHub', url: 'https://github.com/michael-johnson' },
      { id: '2', label: 'LinkedIn', url: 'https://linkedin.com/in/michael-johnson' },
    ],
    photo: {
      url: null,
      shape: 'circle',
      size: 100,
      position: 'right',
      border: 'none',
    },
  },
  summary: 'Staff Software Architect with 9+ years engineering scalable multi-region microservices and high-throughput real-time systems. Spearheaded architecture transitions saving $1.4M annually while mentoring 14+ senior engineers.',
  sections: [
    {
      id: 'sec-exp',
      title: 'Work Experience',
      type: 'experience',
      items: [
        {
          id: 'exp-1',
          title: 'Staff Infrastructure Engineer',
          company: 'Stripe / Cloud Platforms',
          location: 'San Francisco, CA',
          date: '2021 — Present',
          desc: '• Engineered distributed event pipelines handling 4.2B events/day with 99.999% uptime\n• Optimized latency critical p99 API endpoints from 180ms to 24ms across 12 global regions\n• Led company-wide zero-trust migration across 450+ containerized workloads',
        },
        {
          id: 'exp-2',
          title: 'Senior Backend Engineer',
          company: 'Datadog & Systems Group',
          location: 'New York, NY',
          date: '2018 — 2021',
          desc: '• Built automated failover orchestration reducing outage recovery time from 15m to 45s\n• Authored open-source distributed tracing libraries adopted by 8,000+ GitHub organizations',
        },
      ],
    },
    {
      id: 'sec-edu',
      title: 'Education',
      type: 'education',
      items: [
        {
          id: 'edu-1',
          degree: 'B.S. in Computer Science',
          school: 'University of California, Berkeley',
          date: '2014 — 2018',
          gpa: 'GPA: 3.9 / 4.0',
          desc: 'Honors in Distributed Computing, Regents Scholar',
        },
      ],
    },
    {
      id: 'sec-skills',
      title: 'Key Competencies',
      type: 'skills',
      items: [
        {
          id: 'sk-1',
          category: 'Languages & Runtimes',
          items: ['TypeScript', 'Go', 'Rust', 'Python', 'Node.js'],
        },
        {
          id: 'sk-2',
          category: 'Cloud & Systems',
          items: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'PostgreSQL', 'Redis', 'Kafka'],
        },
      ],
    },
  ],
};

export const DEFAULT_RESUME_STYLES = {
  fontFamily: 'Inter',
  fontSizeNamePt: 26,
  fontSizeHeadingsPt: 13,
  fontSizeBodyPt: 10,
  lineHeight: 1.45,
  sectionSpacingMm: 6,
  marginMm: 15,
  accentColor: '#00f0ff',
  headingsColor: '#0f172a',
  bodyColor: '#334155',
  backgroundColor: '#ffffff',
};

export const DEFAULT_COVER_LETTER_CONTENT = {
  sender: {
    name: 'Michael Johnson',
    title: 'Senior Engineering Leader',
    email: 'michael.johnson@techcorp.io',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    website: 'https://michaeljohnson.pro',
  },
  recipient: {
    name: 'Hiring Team',
    title: 'Head of Engineering',
    company: 'Stripe Corporation',
    address: 'South San Francisco, CA',
  },
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  subject: 'Application for Staff Infrastructure Engineer (Req #4092)',
  salutation: 'Dear Hiring Team,',
  body: 'I am writing to express my enthusiastic interest in the Staff Infrastructure Engineer position at Stripe. With nearly a decade of experience designing resilient distributed systems and optimizing high-throughput payment pipelines, I have long admired Stripe\'s engineering rigor and exceptional developer experience.\n\nThroughout my career at Datadog and Stripe Cloud Platforms, I have spearheaded mission-critical architectural shifts. For instance, I recently designed a distributed event streaming engine processing over 4.2 billion daily requests while slashing infrastructure expenditures by $1.4M annually. More importantly, I thrive on unblocking engineers, driving architectural consensus, and fostering a culture of ownership and psychological safety.\n\nGiven Stripe\'s ambitious roadmap in global financial infrastructure, I am eager to contribute my background in distributed systems, zero-downtime migrations, and latency reduction to your world-class team. Thank you very much for your time and consideration.',
  signoff: {
    text: 'Sincerely,',
    signatureName: 'Michael Johnson',
    title: 'Staff Software Architect',
  },
};

export const DEFAULT_COVER_LETTER_STYLES = {
  fontFamily: 'Inter',
  fontSizeBodyPt: 10.5,
  lineHeight: 1.6,
  marginMm: 22,
  accentColor: '#00f0ff',
  headingsColor: '#0f172a',
  bodyColor: '#334155',
  backgroundColor: '#ffffff',
};

// Local storage key for offline caching
const LOCAL_STORAGE_DOCS_KEY = 'careercraft_local_documents';

const getLocalDocs = (): DocumentItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalDocs = (docs: DocumentItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
};

let autoSaveTimeout: NodeJS.Timeout | null = null;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocument: null,
  documentsList: [],
  saveStatus: 'idle',
  history: [],
  historyIndex: -1,
  isLoading: false,

  setCurrentDocument: (doc) => {
    set({
      currentDocument: doc,
      history: doc ? [JSON.parse(JSON.stringify(doc))] : [],
      historyIndex: doc ? 0 : -1,
      saveStatus: 'idle',
    });
  },

  updateContent: (updater) => {
    const { currentDocument, history, historyIndex } = get();
    if (!currentDocument) return;

    const updatedContent = updater(currentDocument.content);
    const updatedDoc: DocumentItem = {
      ...currentDocument,
      content: updatedContent,
      updated_at: new Date().toISOString(),
    };

    // Trim future history if branching from undo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(updatedDoc)));

    set({
      currentDocument: updatedDoc,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      saveStatus: 'saving',
    });

    // Debounced Auto-Save (1.5s)
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      get().saveCurrentDocument();
    }, 1500);
  },

  updateStyles: (updater) => {
    const { currentDocument, history, historyIndex } = get();
    if (!currentDocument) return;

    const updatedStyles = updater(currentDocument.styles);
    const updatedDoc: DocumentItem = {
      ...currentDocument,
      styles: updatedStyles,
      updated_at: new Date().toISOString(),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(updatedDoc)));

    set({
      currentDocument: updatedDoc,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      saveStatus: 'saving',
    });

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      get().saveCurrentDocument();
    }, 1500);
  },

  updateTitle: (title: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const updatedDoc: DocumentItem = {
      ...currentDocument,
      title,
      updated_at: new Date().toISOString(),
    };

    set({ currentDocument: updatedDoc, saveStatus: 'saving' });

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      get().saveCurrentDocument();
    }, 1500);
  },

  setTemplateId: (templateId: string) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    const updatedDoc: DocumentItem = {
      ...currentDocument,
      template_id: templateId,
      updated_at: new Date().toISOString(),
    };

    set({ currentDocument: updatedDoc, saveStatus: 'saving' });

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      get().saveCurrentDocument();
    }, 1500);
  },

  createNewDocument: (type, templateId, title) => {
    const id = crypto.randomUUID();
    const isResume = type === 'resume';

    const newDoc: DocumentItem = {
      id,
      type,
      title: title || (isResume ? 'Professional Resume' : 'Professional Cover Letter'),
      template_id: templateId,
      content: isResume
        ? JSON.parse(JSON.stringify(DEFAULT_RESUME_CONTENT))
        : JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER_CONTENT)),
      styles: isResume
        ? JSON.parse(JSON.stringify(DEFAULT_RESUME_STYLES))
        : JSON.parse(JSON.stringify(DEFAULT_COVER_LETTER_STYLES)),
      is_shared: false,
      share_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const currentList = get().documentsList;
    const updatedList = [newDoc, ...currentList];
    set({
      currentDocument: newDoc,
      documentsList: updatedList,
      history: [JSON.parse(JSON.stringify(newDoc))],
      historyIndex: 0,
      saveStatus: 'saved',
    });

    saveLocalDocs(updatedList);

    // Save to Supabase if configured and online
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          supabase
            .from('documents')
            .insert({
              ...newDoc,
              user_id: data.user.id,
            })
            .then(({ error }) => {
              if (error) console.warn('Supabase document insert note:', error.message);
            });
        }
      });
    }

    return newDoc;
  },

  fetchDocuments: async () => {
    set({ isLoading: true });

    // 1. First load from local storage cache
    const local = getLocalDocs();
    set({ documentsList: local });

    // 2. Sync from Supabase if online and authenticated
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data, error } = await supabase
            .from('documents')
            .select('id, user_id, type, title, template_id, content, styles, share_token, is_shared, created_at, updated_at')
            .order('updated_at', { ascending: false });

          if (!error && data) {
            // Merge cloud documents with local
            set({ documentsList: data });
            saveLocalDocs(data);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch note, using local storage cache:', err);
      }
    }

    set({ isLoading: false });
  },

  saveCurrentDocument: async () => {
    const { currentDocument, documentsList } = get();
    if (!currentDocument) return;

    set({ saveStatus: 'saving' });

    // 1. Update in memory and local storage
    const updatedList = documentsList.map((doc) =>
      doc.id === currentDocument.id ? currentDocument : doc
    );
    if (!updatedList.some((doc) => doc.id === currentDocument.id)) {
      updatedList.unshift(currentDocument);
    }
    set({ documentsList: updatedList });
    saveLocalDocs(updatedList);

    // 2. Sync with Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { error } = await supabase
            .from('documents')
            .upsert({
              ...currentDocument,
              user_id: userData.user.id,
              updated_at: new Date().toISOString(),
            });

          if (error) {
            console.error('Supabase upsert error:', error.message);
            set({ saveStatus: 'error' });
            return;
          }
        }
      } catch (err) {
        console.warn('Offline save fallback to local storage:', err);
      }
    }

    set({ saveStatus: 'saved' });
  },

  deleteDocument: async (id: string) => {
    const updatedList = get().documentsList.filter((d) => d.id !== id);
    set({ documentsList: updatedList });
    saveLocalDocs(updatedList);

    if (get().currentDocument?.id === id) {
      set({ currentDocument: null });
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('documents').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase delete error:', e);
      }
    }
  },

  duplicateDocument: async (id: string) => {
    const original = get().documentsList.find((d) => d.id === id);
    if (!original) throw new Error('Document not found');

    const duplicate: DocumentItem = {
      ...JSON.parse(JSON.stringify(original)),
      id: crypto.randomUUID(),
      title: `${original.title} (Copy)`,
      share_token: null,
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = [duplicate, ...get().documentsList];
    set({ documentsList: updatedList });
    saveLocalDocs(updatedList);

    if (isSupabaseConfigured) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase.from('documents').insert({
          ...duplicate,
          user_id: userData.user.id,
        });
      }
    }

    return duplicate;
  },

  generateShareToken: async (id: string) => {
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const updatedList = get().documentsList.map((d) =>
      d.id === id ? { ...d, share_token: token, is_shared: true } : d
    );
    set({ documentsList: updatedList });
    saveLocalDocs(updatedList);

    if (get().currentDocument?.id === id) {
      set({
        currentDocument: {
          ...get().currentDocument!,
          share_token: token,
          is_shared: true,
        },
      });
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('documents')
        .update({ share_token: token, is_shared: true })
        .eq('id', id);
    }

    return token;
  },

  revokeShareToken: async (id: string) => {
    const updatedList = get().documentsList.map((d) =>
      d.id === id ? { ...d, share_token: null, is_shared: false } : d
    );
    set({ documentsList: updatedList });
    saveLocalDocs(updatedList);

    if (get().currentDocument?.id === id) {
      set({
        currentDocument: {
          ...get().currentDocument!,
          share_token: null,
          is_shared: false,
        },
      });
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('documents')
        .update({ share_token: null, is_shared: false })
        .eq('id', id);
    }
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        currentDocument: JSON.parse(JSON.stringify(prev)),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        currentDocument: JSON.parse(JSON.stringify(next)),
        historyIndex: historyIndex + 1,
      });
    }
  },
}));
