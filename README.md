# ResumeCraft AI 🚀
### The All-in-One AI-Powered Resume Builder — Canva Meets Zety

Build stunning, ATS-optimized resumes in minutes with real-time drag-and-drop editing, AI-powered content generation, dozens of templates, and buttery-smooth animations.

![status](https://img.shields.io/badge/status-in%20development-yellow)
![license](https://img.shields.io/badge/license-MIT-blue)
![tech](https://img.shields.io/badge/stack-MERN%20%2B%20AI-purple)

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Core Features](#-core-features)
3. [AI Features](#-ai-features)
4. [Templates & Design System](#-templates--design-system)
5. [ATS & Export Formats](#-ats--export-formats)
6. [UI/UX & Animations](#-uiux--animations)
7. [Tech Stack](#-tech-stack)
8. [Architecture](#-architecture)
9. [Folder Structure](#-folder-structure)
10. [Database Schema (High-Level)](#-database-schema-high-level)
11. [Getting Started](#-getting-started)
12. [Environment Variables](#-environment-variables)
13. [API Overview](#-api-overview)
14. [Roadmap](#-roadmap)
15. [Contributing](#-contributing)
16. [License](#-license)

---

## 🧭 Overview

**ResumeCraft AI** is a full-stack web application that lets users build professional resumes using a **Canva-style drag-and-drop editor** combined with **Zety-style guided content sections**, supercharged by **AI** for writing summaries, bullet points, skills suggestions, and job-tailored optimization.

**Goals:**
- Beautiful, modern, animation-rich editing experience
- Real AI assistance (not gimmicky) for content writing
- Wide variety of professionally designed templates
- Strict ATS-compliance mode alongside creative/designer modes
- Fast, responsive, and works flawlessly across devices

---

## ✨ Core Features

### 📝 Resume Builder / Editor
- Drag-and-drop section reordering (Experience, Education, Skills, Projects, Certifications, Awards, etc.)
- Live WYSIWYG preview — edits reflect instantly
- Undo/redo history (Ctrl+Z / Ctrl+Y)
- Auto-save + version history / snapshots
- Multi-page support with automatic page-break handling
- Custom sections (user can add their own: Volunteering, Publications, Languages, Hobbies, References)
- Rich text formatting (bold, italic, bullet styles, links)
- Section visibility toggle (show/hide without deleting data)
- Resizable & repositionable elements (Canva-style free canvas mode, optional)
- Photo upload with built-in cropper, filters, and background remover
- Icon library for skills/contact info (LinkedIn, GitHub, Portfolio, Phone, Email, etc.)
- Import existing resume (PDF/DOCX) → auto-parse into structured fields
- Multiple resume profiles per user (e.g., "Frontend Dev Resume", "PM Resume")
- Cover letter builder (matching template design)
- LinkedIn "Import from Profile" (optional OAuth integration)

### 🔐 Account & Collaboration
- Auth (email/password + Google/GitHub OAuth)
- Cloud save & sync across devices
- Shareable public link to resume (view-only, password-optional)
- Team/Recruiter mode: shared folders, comments on resume drafts (stretch goal)
- Resume analytics: views, downloads (for shared links)

### 💳 Monetization-Ready (Optional/Stretch)
- Free tier vs Pro tier (template/AI credit limits)
- Stripe integration for subscriptions
- Watermark on free-tier PDF export

---

## 🤖 AI Features

The AI layer is the differentiator — deeply integrated, not bolted on.

| Feature | Description |
|---|---|
| **AI Summary Generator** | Generates a professional summary based on job title, years of experience, and key skills entered by the user |
| **AI Bullet Point Enhancer** | Converts plain descriptions into powerful, quantifiable, action-verb-driven bullet points |
| **AI Skills Suggester** | Suggests relevant hard/soft skills based on job title & industry, including trending in-demand skills |
| **Job Description Matcher / Tailoring** | User pastes a job description → AI rewrites/reorders resume content to match keywords for that specific role |
| **ATS Score Checker** | AI analyzes resume against ATS parsing rules & keyword density, gives a score + actionable fixes |
| **Grammar & Tone Checker** | Real-time grammar, tone (professional/confident), and conciseness suggestions |
| **AI Cover Letter Generator** | Generates a tailored cover letter using resume data + job description |
| **Smart Achievement Quantifier** | Prompts users with follow-up questions to help quantify achievements ("By how much did you improve X?") |
| **Industry Template Recommender** | Suggests the best template/design based on target industry (creative vs corporate vs technical) |
| **Multi-language Translation** | Translate resume content while preserving formatting |

> **Suggested implementation:** Use an LLM API (e.g., Claude API via Anthropic) with structured prompts per feature, streaming responses into the editor for a smooth, real-time feel. Cache/debounce AI calls to control costs.

---

## 🎨 Templates & Design System

- **50+ professionally designed templates** across categories:
  - Minimal / Clean
  - Modern / Creative
  - Corporate / Executive
  - Technical / Developer
  - Academic / Research
  - Creative-visual (for designers, marketers)
- **Font system:** 30+ curated Google Fonts (serif, sans-serif, mono, display), with pairing suggestions (heading + body font combos)
- **Color themes:** Preset palettes + full custom color picker (per-section accent colors)
- **Layout variants:** Single column, two-column, sidebar-left, sidebar-right, timeline-style
- **Spacing & density controls:** Compact / Comfortable / Spacious
- **Template live-switching:** Change template anytime without losing data (content ↔ design fully decoupled)
- **Custom template builder** (advanced/stretch): users design and save their own template as reusable

---

## 📄 ATS & Export Formats

- **ATS-Safe Mode:** Single-column, no graphics/icons/tables, standard fonts, proper heading hierarchy — guarantees clean parsing by ATS systems (Workday, Greenhouse, Taleo, etc.)
- **Designer Mode:** Full creative freedom (columns, icons, colors, graphics) for direct human review / portfolio use
- **Export formats:**
  - PDF (primary, print-ready, high-res)
  - DOCX (editable Word format)
  - TXT (plain text, ATS raw-parse friendly)
  - PNG/JPEG (for social sharing, e.g., LinkedIn post image)
  - JSON (resume data export/import — portable across the app)
- **Print optimization:** Correct margins, page breaks, and DPI for physical printing

---

## 🎬 UI/UX & Animations

- Framer Motion (or GSAP) for:
  - Smooth section enter/exit transitions
  - Drag-and-drop reordering with spring physics
  - Template switch cross-fade/morph transition
  - Micro-interactions on buttons, toggles, and AI-generate actions (loading shimmer, typewriter effect for AI text)
  - Page transitions (editor ↔ dashboard ↔ template gallery)
- Skeleton loaders for async content (AI generation, template loading)
- Dark mode / Light mode toggle with smooth theme transition
- Fully responsive: desktop editor, tablet, and a simplified mobile view/preview mode
- Keyboard shortcuts for power users
- Toast notifications for save/export/error states
- Onboarding walkthrough (guided tour) for first-time users

---

## 🛠 Tech Stack

**Frontend**
- React (Next.js recommended for SSR/SEO on public share pages)
- TailwindCSS + shadcn/ui for components
- Framer Motion for animation
- Zustand or Redux Toolkit for state management
- react-beautiful-dnd / dnd-kit for drag-and-drop
- react-pdf / @react-pdf/renderer for PDF generation

**Backend**
- Node.js + Express (or Next.js API routes)
- MongoDB (flexible schema for varied resume structures) or PostgreSQL (if relational integrity preferred)
- Redis for caching AI responses & rate-limiting

**AI Layer**
- Anthropic Claude API (or OpenAI) for text generation
- Prompt templates stored server-side, versioned
- Streaming responses via Server-Sent Events / WebSockets

**Infrastructure**
- Cloudinary / S3 for image & PDF storage
- Stripe for payments (optional)
- Vercel / Render / AWS for deployment
- Puppeteer or WeasyPrint for high-fidelity PDF rendering (server-side)

**Auth**
- NextAuth.js / Clerk / Auth0

---

## 🏗 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Frontend  │ <--> │   Backend    │ <--> │   AI Service    │
│  (Next.js)  │      │ (Node/Express)│      │ (Claude API)    │
└─────────────┘      └──────────────┘      └────────────────┘
       │                     │
       │                     ▼
       │              ┌──────────────┐
       │              │   Database    │
       │              │ (Mongo/Postgres)│
       │              └──────────────┘
       ▼
┌─────────────┐
│  PDF Engine  │  (Server-side rendering for pixel-perfect export)
└─────────────┘
```

---

## 📁 Folder Structure

```
resumecraft-ai/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── components/
│   │   │   ├── editor/       # Canvas, drag-drop, sections
│   │   │   ├── templates/    # Template components
│   │   │   ├── ai/           # AI panel, prompts UI
│   │   │   └── ui/           # Buttons, modals, shared UI
│   │   ├── pages/ or app/
│   │   ├── hooks/
│   │   ├── store/            # Zustand/Redux state
│   │   ├── styles/
│   │   └── lib/
│   └── server/                # Express/Node backend
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       │   ├── ai.service.js
│       │   ├── pdf.service.js
│       │   └── resume.service.js
│       ├── models/
│       └── middleware/
├── packages/
│   ├── templates/             # Shared template definitions (JSON/schema)
│   └── shared-types/          # TypeScript types shared FE/BE
├── prompts/                   # Versioned AI prompt templates
├── public/
├── .env.example
├── README.md
└── package.json
```

---

## 🗄 Database Schema (High-Level)

**User**
```
id, name, email, passwordHash, plan (free/pro), createdAt
```

**Resume**
```
id, userId, title, templateId, theme { font, colors, spacing },
sections: [
  { type: "summary", content, order, visible },
  { type: "experience", items: [...], order, visible },
  { type: "education", items: [...], order, visible },
  { type: "skills", items: [...], order, visible },
  ...
],
atsMode: boolean,
lastEditedAt, versionHistory: [...]
```

**Template**
```
id, name, category, previewImage, layoutConfig, defaultTheme, isATSFriendly
```

**AIGeneration** (for logging/caching/rate-limits)
```
id, userId, resumeId, type (summary/bullet/skills/ats-check), input, output, createdAt
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB or PostgreSQL instance
- Anthropic/OpenAI API key

### Installation
```bash
git clone https://github.com/your-username/resumecraft-ai.git
cd resumecraft-ai
npm install
```

### Environment Setup
Copy `.env.example` to `.env` and fill in the values (see below).

### Run Locally
```bash
npm run dev
```

App will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=your_mongo_or_postgres_url

# Auth
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=your_key_here

# Storage
CLOUDINARY_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Payments (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🔌 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/resumes` | GET/POST | List / create resumes |
| `/api/resumes/:id` | GET/PUT/DELETE | Fetch, update, delete a resume |
| `/api/resumes/:id/export` | POST | Export resume as PDF/DOCX/TXT/PNG |
| `/api/templates` | GET | List all templates |
| `/api/ai/summary` | POST | Generate AI summary |
| `/api/ai/bullets` | POST | Enhance bullet points |
| `/api/ai/skills` | POST | Suggest skills |
| `/api/ai/ats-score` | POST | Get ATS compatibility score |
| `/api/ai/tailor` | POST | Tailor resume to job description |
| `/api/auth/*` | — | Auth routes (NextAuth) |

---

## 🗺 Roadmap

- [ ] MVP: Core editor + 10 templates + basic AI summary
- [ ] ATS mode + ATS scoring
- [ ] Full template library (50+) + font/theme system
- [ ] AI job-description tailoring
- [ ] Cover letter builder
- [ ] Animations & transitions polish pass
- [ ] Mobile-responsive editor
- [ ] Team/recruiter collaboration mode
- [ ] Public template marketplace (user-submitted templates)
- [ ] Resume analytics dashboard
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow the existing code style and add tests where applicable.

---

## 📄 License

This project is licensed under the MIT License — see the `LICENSE` file for details.

---

### 💡 Note
This README is a project blueprint. Treat each section (AI features, templates, ATS mode, animations) as its own module/sprint — building them incrementally will keep the codebase clean and the app performant as it scales.
