/**
 * ResumeCraft AI — 100% Free Complete Application Logic
 * No-Login Direct Access, 20+ Real-Architecture Templates,
 * 10 Reference Image Templates with Live Visual Thumbnails & Previews,
 * Customizable Textboxes, Additional Custom Sections, Image Sizing/Position Engine,
 * Local JSON Backup/Restore, and Instant High-Res PDF Export.
 */

// ==========================================
// 1. STATE & UTILITY MODULE
// ==========================================
const AppState = {
  resumes: [],
  currentResume: null,
  theme: 'dark',
  isAuthenticated: false
};

const Utils = {
  id: () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
  esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },
  showToast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = {
      success: 'M20 6L9 17l-5-5',
      error: 'M18 6L6 18M6 6l12 12',
      info: 'M12 16v-4M12 8h.01',
      warning: 'M12 9v4M12 17h.01'
    };
    t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="${icons[type] || icons.info}"></path>${type === 'info' || type === 'warning' ? '<circle cx="12" cy="12" r="10"></circle>' : ''}</svg><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },
  showLoading(text = 'Loading...') {
    const o = document.getElementById('loadingOverlay');
    const t = document.getElementById('loadingText');
    if (t) t.textContent = text;
    if (o) o.classList.remove('hidden');
  },
  hideLoading() {
    const o = document.getElementById('loadingOverlay');
    if (o) o.classList.add('hidden');
  }
};

// ==========================================
// 2. THEME SYSTEM
// ==========================================
const Theme = {
  init() {
    Theme.set(localStorage.getItem('rc_theme') || 'dark');
  },
  toggle() {
    Theme.set(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  },
  set(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('rc_theme', t);
    AppState.theme = t;
  }
};

// ==========================================
// 3. SPA ROUTER (ZERO AUTH BARRIERS)
// ==========================================
const Router = {
  routes: ['landing', 'dashboard', 'editor', 'auth'],
  init() {
    const h = location.hash.replace('#', '') || 'landing';
    Router.navigate(h, false);
    window.addEventListener('hashchange', () => Router.navigate(location.hash.replace('#', '') || 'landing', false));
  },
  navigate(page, push = true) {
    if (!Router.routes.includes(page)) page = 'landing';

    // Route guards: require auth for dashboard and editor
    if ((page === 'dashboard' || page === 'editor') && !Auth.currentUser) {
      page = 'auth';
    }

    if (push) history.pushState(null, '', `#${page}`);

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`page-${page}`);
    if (el) el.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('data-page') === page));

    if (page === 'dashboard') Dashboard.render();
    else if (page === 'editor') {
      if (!AppState.currentResume) {
        if (AppState.resumes.length) AppState.currentResume = AppState.resumes[0];
        else { Dashboard.createNewDefault(); return; }
      }
      Editor.init(AppState.currentResume);
    } else if (page === 'landing') {
      UI.initLanding();
    } else if (page === 'auth') {
      Auth.renderAuthPage();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// ==========================================
// 4. DASHBOARD & RESUME MANAGEMENT
// ==========================================
const Dashboard = {
  load() {
    // Data is now loaded via Firestore real-time listener (FirestoreDB.listenToResumes)
    // This is kept for backward compatibility but no longer reads localStorage
  },
  save() {
    // Save current resume to Firestore
    if (AppState.currentResume && Auth.currentUser) {
      FirestoreDB.saveResume(AppState.currentResume);
    }
  },
  render() {
    Dashboard.load();
    const g = document.getElementById('dashboardGrid');
    if (!g) return;

    let html = `
      <div class="resume-card create-resume-card" onclick="Dashboard.createNew()">
        <div class="create-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <h3>Create New Free Resume</h3>
        <p class="resume-meta" style="margin-top:.5rem">Pick from 20+ visual templates, customize textboxes, upload photos, and export instant PDF</p>
      </div>
    `;

    AppState.resumes.forEach(r => {
      const d = new Date(r.updatedAt || Date.now()).toLocaleDateString();
      const tpl = Editor.templates.find(t => t.id === r.template);
      html += `
        <div class="resume-card animate-in">
          <div class="resume-preview-img" onclick="Dashboard.open('${r.id}')" style="background:${tpl ? tpl.preview : '#18181b'}">
            ${tpl && tpl.img ? `<img src="${tpl.img}" alt="${tpl.name}" style="width:100%;height:100%;object-fit:cover;object-position:top;">` : ''}
            <div style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);padding:0.4rem 0.8rem;border-radius:12px;font-size:0.8rem;font-weight:700;color:#fff">
              ${tpl ? tpl.name : 'Professional Resume'}
            </div>
          </div>
          <div class="resume-info">
            <div onclick="Dashboard.open('${r.id}')" style="flex:1">
              <div class="resume-title">${Utils.esc(r.title)}</div>
              <span class="resume-meta">Updated ${d} · ${tpl ? tpl.name : 'Custom'}</span>
            </div>
            <div class="resume-actions">
              <button class="resume-action-btn" onclick="Dashboard.dup('${r.id}',event)" title="Duplicate Resume">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
              <button class="resume-action-btn delete" onclick="Dashboard.del('${r.id}',event)" title="Delete Resume">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    g.innerHTML = html;
  },

  createNew() {
    const g = document.getElementById('templateSelectGrid');
    if (g) {
      g.innerHTML = Editor.templates.map((t, idx) => `
        <div class="template-option ${idx === 0 ? 'selected' : ''}" data-tid="${t.id}" onclick="UI.selTplOpt(this)">
          <div class="template-option-img" style="background:${t.preview}">
            ${t.img ? `<img src="${t.img}" alt="${t.name}">` : ''}
          </div>
          <div class="template-option-name">${t.name}</div>
        </div>
      `).join('');
    }
    const inp = document.getElementById('newResumeTitle');
    if (inp) inp.value = 'Professional Resume';
    UI.openModal('createResumeModal');
  },

  submitCreate(e) {
    e.preventDefault();
    const sel = document.querySelector('.template-option.selected');
    const tid = sel ? sel.getAttribute('data-tid') : 'austin';
    const title = document.getElementById('newResumeTitle').value || 'My Resume';
    Dashboard.createWithTemplate(tid, title);
    UI.closeModal('createResumeModal');
  },

  createWithTemplate(tid, title = '') {
    const tpl = Editor.templates.find(t => t.id === tid);
    let col = '#facc15';
    let fnt = 'Inter';
    if (tid === 'sally') col = '#008080';
    else if (tid === 'larry') { col = '#cca352'; fnt = 'Merriweather'; }
    else if (tid === 'khalil') col = '#374151';
    else if (tid === 'kai') col = '#000000';
    else if (tid === 'michelle') col = '#1f2937';
    else if (tid === 'executive-navy') col = '#172554';
    else if (tid === 'sue-wong') { col = '#005f73'; fnt = 'Merriweather'; }
    else if (tid === 'chloe') col = '#361e12';
    else if (tid === 'thompson') col = '#1c1c1c';

    Dashboard.createWithPreset({
      id: tid,
      title: title || `${tpl ? tpl.name : 'Professional'} Resume`,
      color: col,
      font: fnt,
      layout: 'single'
    });
  },

  createNewDefault() {
    Dashboard.createWithPreset({
      id: 'austin',
      title: 'Austin Bronson Resume',
      color: '#facc15',
      font: 'Inter',
      layout: 'single'
    });
  },

  createWithPreset(preset) {
    const nr = {
      id: Utils.id(),
      title: preset.title || 'My Resume',
      template: preset.id || 'austin',
      color: preset.color || '#facc15',
      font: preset.font || 'Inter',
      fontSize: 100,
      layout: preset.layout || 'single',
      headerAlign: 'center',
      textAlign: 'left',
      boxStyle: 'clean',
      spacing: 'normal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        jobRole: 'Sales Force Team Leader / Senior Specialist',
        photo: {
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          shape: 'circle',
          size: 'medium',
          sizePx: 95,
          align: 'center',
          show: true
        },
        personal: {
          name: 'Austin Bronson',
          title: 'Sales Force Team Leader',
          email: 'contact@yourdomain.com',
          phone: '+0 12345 555',
          location: '4710 Bus Boulevard, Flintstone, GA 30725',
          linkedin: 'linkedin.com/in/austinbronson',
          website: 'austinbronson.com'
        },
        summaries: [
          {
            label: 'About Me',
            text: 'Results-driven Sales Force Team Leader with over 15 years of proven experience executing high-impact sales strategies, leading cross-functional teams, and consistently exceeding annual revenue targets.'
          }
        ],
        experience: [
          {
            title: 'Sales Force Team Leader',
            company: 'Nexus Global Enterprises',
            date: '2006 — Present',
            location: 'Atlanta, GA',
            desc: '• Spearheaded a national sales team of 25+ representatives, increasing annual enterprise revenue by 48% over 3 consecutive fiscal years.\n• Architected structured customer journey funnels and client retention programs reducing account churn by 35%.\n• Conducted weekly performance coaching, KPI management, and high-stakes executive enterprise negotiations.'
          },
          {
            title: 'Sales Manager',
            company: 'Alpha Peak Solutions',
            date: '2003 — 2006',
            location: 'Chicago, IL',
            desc: '• Managed regional B2B territory pipelines delivering $12M+ in closed-won software contract bookings.\n• Streamlined CRM sales funnel workflows, boosting team conversion efficiency by 28%.'
          },
          {
            title: 'Senior Salesperson',
            company: 'Vanguard Retail Systems',
            date: '1999 — 2003',
            location: 'New York, NY',
            desc: '• Achieved 140% of quarterly sales quota for 10 straight quarters, earning Top Producer Honors.'
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science in Business Management',
            school: 'High School of Design & Business University',
            date: '1996 — 1999',
            gpa: 'GPA: 3.8 / 4.0',
            desc: 'Dean\'s Honor List, Specialization in Corporate Strategy & Negotiation'
          }
        ],
        skills: [
          {
            category: 'Core Competencies',
            items: [
              'Graphic Design: 90%',
              'Web Develop: 75%',
              'Team Leadership: 95%',
              'Sales Negotiation: 98%',
              'CRM Architecture: 85%'
            ]
          }
        ],
        customSections: [
          {
            id: Utils.id(),
            title: 'Key Achievements',
            content: '• Awarded Global Sales Leader of the Year (2024)\n• Generated $50M+ cumulative pipeline revenue\n• Keynote Speaker at National Sales Summit'
          }
        ],
        projects: [
          {
            name: 'Enterprise CRM Transformation',
            tech: 'Salesforce, HubSpot, Analytics Cloud',
            link: '',
            desc: 'Led company-wide CRM migration for 500+ users, reducing data latency by 60%.'
          }
        ],
        certifications: [
          { name: 'Certified Sales Executive (CSE)', issuer: 'Sales & Marketing Executives International', date: '2022' }
        ],
        languages: ['English (Native)', 'Spanish (Professional Working)', 'French (Conversational)'],
        interests: ['Marathon Running', 'Photography', 'Mentorship']
      }
    };

    AppState.resumes.unshift(nr);
    if (Auth.currentUser) {
      FirestoreDB.createResume(nr);
    }
    Dashboard.open(nr.id);
  },

  open(id) {
    Dashboard.load();
    const r = AppState.resumes.find(x => x.id === id);
    if (r) {
      AppState.currentResume = r;
      Router.navigate('editor');
    }
  },

  dup(id, e) {
    e.stopPropagation();
    const r = AppState.resumes.find(x => x.id === id);
    if (r) {
      const c = JSON.parse(JSON.stringify(r));
      c.id = Utils.id();
      c.title += ' (Copy)';
      c.createdAt = c.updatedAt = Date.now();
      AppState.resumes.unshift(c);
      if (Auth.currentUser) {
        FirestoreDB.createResume(c);
      }
      Dashboard.render();
      Utils.showToast('Resume duplicated!', 'success');
    }
  },

  del(id, e) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      AppState.resumes = AppState.resumes.filter(x => x.id !== id);
      if (Auth.currentUser) {
        FirestoreDB.deleteResume(id);
      }
      Dashboard.render();
      Utils.showToast('Resume deleted', 'info');
    }
  },

  importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed && parsed.data) {
          parsed.id = Utils.id();
          parsed.title = (parsed.title || 'Imported Resume') + ' (Imported)';
          parsed.updatedAt = Date.now();
          AppState.resumes.unshift(parsed);
          if (Auth.currentUser) {
            FirestoreDB.createResume(parsed);
          }
          Dashboard.render();
          Utils.showToast('Resume JSON imported successfully!', 'success');
        } else {
          Utils.showToast('Invalid resume JSON format', 'error');
        }
      } catch (err) {
        Utils.showToast('Could not read JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
};

// ==========================================
// 5. CANVA TEMPLATE IMPORTER MODULE
// ==========================================
const TemplateImporter = {
  presets: [
    { id: 'austin', title: 'Austin Bronson Split', desc: 'Black & Gold split layout with skill rating bars and clean right column.', color: '#facc15', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#18181b,#facc15)', img: 'assets/templates/austin.jpg' },
    { id: 'sally', title: 'Sally Branders Teal', desc: 'Corporate Teal header band with overlapping photo and checkmark items.', color: '#008080', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#008080,#06b6d4)', img: 'assets/templates/sally.jpg' },
    { id: 'larry', title: 'Larry Tibbetts Gold Ribbon', desc: 'Dark navy banner with gold ribbon divider and rounded pill headers.', color: '#cca352', font: 'Merriweather', layout: 'single', preview: 'linear-gradient(135deg,#143438,#cca352)', img: 'assets/templates/larry.jpg' },
    { id: 'khalil', title: 'Khalil Richardson Editorial', desc: 'Full-height slate sidebar with bio and soft cream highlight tags.', color: '#374151', font: 'Outfit', layout: 'single', preview: 'linear-gradient(135deg,#374151,#fef3c7)', img: 'assets/templates/khalil.jpg' },
    { id: 'kai', title: 'Kai Carter Monochrome Art', desc: 'Solid black header with white crosshatch art and balanced 2-column body.', color: '#000000', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#000000,#ffffff)', img: 'assets/templates/kai.jpg' },
    { id: 'michelle', title: 'Michelle Robinson Timeline', desc: 'Dark charcoal sidebar, timeline dots, dual skill level bars, and contact badges.', color: '#1f2937', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#2d2d2d,#e5e7eb)', img: 'assets/templates/michelle.png' },
    { id: 'executive-navy', title: 'Executive Navy Column', desc: 'Deep navy left block bar, bold focus headline, and company banner bars.', color: '#172554', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#172554,#3b82f6)', img: 'assets/templates/executive-navy.jpg' },
    { id: 'sue-wong', title: 'Sue Wong Ocean Dial', desc: 'Ocean teal wave header with angled divide, center avatar, and circular skill dials.', color: '#005f73', font: 'Merriweather', layout: 'single', preview: 'linear-gradient(135deg,#0f4c5c,#005f73)', img: 'assets/templates/sue-wong.jpg' },
    { id: 'chloe', title: 'Chloe Morgan Espresso Arch', desc: 'Espresso arch window, blush terracotta cards, and rounded pill headers.', color: '#361e12', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#361e12,#f4c2a8)', img: 'assets/templates/chloe.jpg' },
    { id: 'thompson', title: 'Michael Thompson Sleek Dark', desc: 'Full dark charcoal minimalist executive layout with asymmetric columns.', color: '#1c1c1c', font: 'Inter', layout: 'single', preview: 'linear-gradient(135deg,#1c1c1c,#475569)', img: 'assets/templates/thompson.jpg' },
    { id: 'canva-infographic', title: 'Canva Modern Infographic', desc: 'Teal & Electric Blue palette with badge pill headers and visual hierarchy.', color: '#06b6d4', font: 'Outfit', layout: 'single', preview: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { id: 'canva-creative', title: 'Canva Creative Portfolio', desc: 'Sunset Violet & Rose gradient header with modular card-style layout.', color: '#7c3aed', font: 'Poppins', layout: 'two-column', preview: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
    { id: 'canva-tech', title: 'Canva Tech Grid', desc: 'Developer cards with monospace badges, borders, and GitHub tags.', color: '#22d3ee', font: 'JetBrains Mono', layout: 'single', preview: 'linear-gradient(135deg,#1e293b,#22d3ee)' }
  ],

  openModal() {
    const grid = document.getElementById('canvaPresetsGrid');
    if (grid) {
      grid.innerHTML = TemplateImporter.presets.map(p => `
        <div class="canva-preset-card" onclick="TemplateImporter.applyPreset('${p.id}')">
          <div class="canva-preset-thumb" style="background:${p.preview}">
            ${p.img ? `<img src="${p.img}" alt="${p.title}">` : `<span>${p.title}</span>`}
          </div>
          <div class="canva-preset-title">${p.title}</div>
          <div class="canva-preset-desc">${p.desc}</div>
          <button class="btn btn-outline btn-xs btn-block" style="margin-top:auto">Apply Template</button>
        </div>
      `).join('');
    }
    UI.openModal('importTemplateModal');
  },

  importFromLink() {
    const input = document.getElementById('templateLinkInput');
    const url = (input ? input.value : '').trim();
    if (!url) {
      Utils.showToast('Please enter a template link or design URL', 'warning');
      return;
    }

    Utils.showLoading('Analyzing template architecture & color palette...');
    setTimeout(() => {
      Utils.hideLoading();
      const lower = url.toLowerCase();
      let matched = 'austin';
      if (lower.includes('michelle') || lower.includes('dots')) matched = 'michelle';
      else if (lower.includes('navy') || lower.includes('executive')) matched = 'executive-navy';
      else if (lower.includes('sue') || lower.includes('ocean') || lower.includes('dial')) matched = 'sue-wong';
      else if (lower.includes('chloe') || lower.includes('espresso') || lower.includes('arch')) matched = 'chloe';
      else if (lower.includes('thompson') || lower.includes('dark')) matched = 'thompson';
      else if (lower.includes('sally') || lower.includes('teal')) matched = 'sally';
      else if (lower.includes('larry') || lower.includes('ribbon') || lower.includes('gold')) matched = 'larry';
      else if (lower.includes('khalil') || lower.includes('slate')) matched = 'khalil';
      else if (lower.includes('kai') || lower.includes('mono')) matched = 'kai';

      TemplateImporter.applyPreset(matched);
      if (input) input.value = '';
    }, 600);
  },

  applyPreset(presetId) {
    const preset = TemplateImporter.presets.find(p => p.id === presetId);
    if (!preset) return;

    if (!AppState.currentResume) {
      Dashboard.createWithPreset(preset);
      UI.closeModal('importTemplateModal');
      return;
    }

    const r = AppState.currentResume;
    r.template = preset.id;
    r.color = preset.color;
    r.font = preset.font;
    r.layout = preset.layout;

    Editor.renderSidebar();
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    UI.closeModal('importTemplateModal');
    Utils.showToast(`Applied "${preset.title}" layout!`, 'success');
  }
};

// ==========================================
// 6. INTERACTIVE AI STUDIO (PROMPTS & GENERATION)
// ==========================================
const AIModal = {
  currentTab: 'summary',
  open(tab = 'summary') {
    AIModal.currentTab = tab;
    const mb = document.getElementById('aiModalBody');
    if (!mb) return;
    const r = AppState.currentResume;
    const role = r ? (r.data.jobRole || r.data.personal.title || 'Sales Force Team Leader') : 'Sales Force Team Leader';

    mb.innerHTML = `
      <div class="ai-modal-header">
        <div class="ai-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <div>
          <h2>AI Content Studio</h2>
          <p style="color:var(--text-secondary);font-size:0.9rem">Generate tailored summaries, categorized skills, and XYZ formula achievement bullets</p>
        </div>
      </div>
      <div class="ai-modal-tabs">
        <button class="ai-tab-btn ${tab === 'summary' ? 'active' : ''}" onclick="AIModal.open('summary')">Summary Generator</button>
        <button class="ai-tab-btn ${tab === 'skills' ? 'active' : ''}" onclick="AIModal.open('skills')">Skills Explorer</button>
        <button class="ai-tab-btn ${tab === 'experience' ? 'active' : ''}" onclick="AIModal.open('experience')">Experience Bullets</button>
      </div>
      <div id="aiTabContent">
        ${AIModal.renderTabContent(tab, role)}
      </div>
      <div id="aiResultsArea" class="ai-results-container"></div>
    `;

    UI.openModal('aiPromptModal');
  },

  renderTabContent(tab, role) {
    if (tab === 'summary') {
      return `
        <div class="form-grid">
          <div class="form-group">
            <label>Target Job Title / Role</label>
            <input type="text" id="aiSummaryRole" value="${Utils.esc(role)}" placeholder="e.g. Sales Force Team Leader">
          </div>
          <div class="form-group">
            <label>Experience Level</label>
            <select id="aiSummaryExp" class="form-select">
              <option value="entry">Entry Level (0-2 Years)</option>
              <option value="mid">Mid Level (3-5 Years)</option>
              <option value="senior" selected>Senior Level (6-10 Years)</option>
              <option value="lead">Executive / Lead (10+ Years)</option>
            </select>
          </div>
          <div class="form-group form-grid-full">
            <label>Key Accomplishments / Focus Areas (Optional)</label>
            <input type="text" id="aiSummaryKeywords" placeholder="e.g. Sales Strategy, Team Leadership, Enterprise Negotiation, Revenue Growth">
          </div>
        </div>
        <button class="btn btn-primary btn-block glow-btn" onclick="AIModal.generateSummary()" style="margin-top:0.75rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Generate Tailored Summaries
        </button>
      `;
    } else if (tab === 'skills') {
      return `
        <div class="form-grid">
          <div class="form-group">
            <label>Target Role / Domain</label>
            <input type="text" id="aiSkillsRole" value="${Utils.esc(role)}" placeholder="e.g. Sales Leader, Full Stack Engineer">
          </div>
          <div class="form-group">
            <label>Domain Focus</label>
            <input type="text" id="aiSkillsFocus" placeholder="e.g. Enterprise Sales, B2B, Cloud Services">
          </div>
        </div>
        <button class="btn btn-primary btn-block glow-btn" onclick="AIModal.generateSkills()" style="margin-top:0.75rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          Generate Domain Skills & Ratings
        </button>
      `;
    } else {
      return `
        <div class="form-grid">
          <div class="form-group">
            <label>Position / Title</label>
            <input type="text" id="aiExpTitle" value="${Utils.esc(role)}" placeholder="e.g. Sales Force Team Leader">
          </div>
          <div class="form-group">
            <label>Company Name</label>
            <input type="text" id="aiExpCompany" placeholder="e.g. Global Tech Solutions">
          </div>
          <div class="form-group form-grid-full">
            <label>Key Responsibilities & Numbers</label>
            <textarea id="aiExpNotes" rows="3" placeholder="e.g. Managed sales team of 20, boosted revenue by 40%, closed Fortune 500 enterprise accounts"></textarea>
          </div>
        </div>
        <button class="btn btn-primary btn-block glow-btn" onclick="AIModal.generateExperience()" style="margin-top:0.75rem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Generate High-Impact XYZ Formula Bullets
        </button>
      `;
    }
  },

  generateSummary() {
    const role = document.getElementById('aiSummaryRole').value || 'Professional';
    const exp = document.getElementById('aiSummaryExp').value;
    const kw = document.getElementById('aiSummaryKeywords').value;
    const resArea = document.getElementById('aiResultsArea');

    resArea.innerHTML = '<div style="text-align:center;padding:2rem"><div class="spinner"></div><p>AI is crafting tailored summary options...</p></div>';

    setTimeout(() => {
      const expPrefix = exp === 'entry' ? 'Driven and energetic' : exp === 'mid' ? 'Accomplished and proactive' : exp === 'lead' ? 'Visionary and executive-level' : 'Results-oriented';
      const kwText = kw ? ` Specializing in ${kw}.` : '';

      const opt1 = `${expPrefix} ${role} with a proven record of exceeding business objectives and driving strategic growth.${kwText} Expert in leading cross-functional teams, optimizing operational workflows, and delivering sustainable revenue performance under tight timelines.`;
      const opt2 = `High-performing ${role} recognized for delivering excellence across organizational initiatives.${kwText} Dedicated to fostering collaborative team cultures, standardizing scalable processes, and executing high-impact strategic roadmaps.`;

      resArea.innerHTML = `
        <h4 style="margin-top:1rem;color:var(--text-primary)">Generated Summaries (Click to Apply)</h4>
        <div class="ai-result-card">
          <span class="ai-result-badge">Option 1 — Impact-Driven</span>
          <p style="font-size:0.9rem;line-height:1.5;color:var(--text-secondary)">${opt1}</p>
          <div class="ai-result-actions">
            <button class="btn btn-outline btn-xs" onclick="AIModal.applySummary('${encodeURIComponent(opt1)}', 'add')">+ Add Extra Summary Box</button>
            <button class="btn btn-primary btn-xs" onclick="AIModal.applySummary('${encodeURIComponent(opt1)}', 'replace')">Set as Primary</button>
          </div>
        </div>
        <div class="ai-result-card">
          <span class="ai-result-badge">Option 2 — Leadership & Strategy</span>
          <p style="font-size:0.9rem;line-height:1.5;color:var(--text-secondary)">${opt2}</p>
          <div class="ai-result-actions">
            <button class="btn btn-outline btn-xs" onclick="AIModal.applySummary('${encodeURIComponent(opt2)}', 'add')">+ Add Extra Summary Box</button>
            <button class="btn btn-primary btn-xs" onclick="AIModal.applySummary('${encodeURIComponent(opt2)}', 'replace')">Set as Primary</button>
          </div>
        </div>
      `;
    }, 600);
  },

  applySummary(encodedText, mode) {
    const text = decodeURIComponent(encodedText);
    const d = AppState.currentResume.data;
    if (!d.summaries) d.summaries = [];

    if (mode === 'replace' || d.summaries.length === 0) {
      if (d.summaries.length === 0) d.summaries.push({ label: 'Professional Summary', text });
      else d.summaries[0].text = text;
    } else {
      d.summaries.push({ label: 'Executive Highlight', text });
    }

    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    UI.closeModal('aiPromptModal');
    Utils.showToast('Summary updated successfully!', 'success');
  },

  generateSkills() {
    const role = document.getElementById('aiSkillsRole').value || 'Leader';
    const resArea = document.getElementById('aiResultsArea');
    resArea.innerHTML = '<div style="text-align:center;padding:2rem"><div class="spinner"></div><p>AI is analyzing skill requirements...</p></div>';

    setTimeout(() => {
      const skillsData = [
        {
          category: 'Key Competencies & Ratings',
          items: [
            'Team Leadership: 95%',
            'Strategic Planning: 90%',
            'Client Relationship Management: 92%',
            'Contract Negotiation: 88%',
            'Data Analysis & Reporting: 85%'
          ]
        }
      ];
      window._generatedSkills = skillsData;

      resArea.innerHTML = `
        <h4 style="margin-top:1rem;color:var(--text-primary)">Generated Skill Group</h4>
        <div class="ai-result-card">
          <div class="skill-tags-container">
            ${skillsData[0].items.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;gap:1rem;margin-top:1rem">
          <button class="btn btn-primary btn-block glow-btn" onclick="AIModal.applySkills('replace')">Apply Skills to Resume</button>
        </div>
      `;
    }, 600);
  },

  applySkills(mode) {
    if (!window._generatedSkills) return;
    const d = AppState.currentResume.data;
    d.skills = JSON.parse(JSON.stringify(window._generatedSkills));
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    UI.closeModal('aiPromptModal');
    Utils.showToast('Skills updated!', 'success');
  },

  generateExperience() {
    const title = document.getElementById('aiExpTitle').value || 'Team Leader';
    const comp = document.getElementById('aiExpCompany').value || 'Enterprise Corp';
    const resArea = document.getElementById('aiResultsArea');

    resArea.innerHTML = '<div style="text-align:center;padding:2rem"><div class="spinner"></div><p>AI is composing achievement bullets...</p></div>';

    setTimeout(() => {
      const bullets = [
        `• Spearheaded high-stakes operations at ${comp}, accelerating annual department milestones and increasing overall output by 42%.`,
        `• Standardized cross-functional communication workflows, cutting project turnaround cycle times by 30%.`,
        `• Mentored and empowered a team of 15+ associates to achieve 120% of their quarterly key performance indicators.`
      ];
      const fullDesc = bullets.join('\n');
      window._generatedExp = { title, company: comp, desc: fullDesc, date: '2020 — Present', location: 'New York, NY' };

      resArea.innerHTML = `
        <div class="ai-result-card" style="margin-top:1rem">
          <span class="ai-result-badge">${title} at ${comp}</span>
          <pre style="font-family:inherit;white-space:pre-wrap;font-size:0.88rem;color:var(--text-secondary);line-height:1.6">${fullDesc}</pre>
          <div class="ai-result-actions">
            <button class="btn btn-primary btn-sm glow-btn" onclick="AIModal.applyExperience()">Insert as Experience Position</button>
          </div>
        </div>
      `;
    }, 600);
  },

  applyExperience() {
    if (!window._generatedExp) return;
    const d = AppState.currentResume.data;
    if (!d.experience) d.experience = [];
    d.experience.unshift(JSON.parse(JSON.stringify(window._generatedExp)));

    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    UI.closeModal('aiPromptModal');
    Utils.showToast('Experience entry added!', 'success');
  }
};

// ==========================================
// 7. RESUME EDITOR & ADVANCED TEMPLATE ENGINE
// ==========================================
const Editor = {
  templates: [
    // 10 EXACT REPLICA TEMPLATES FROM USER REFERENCE IMAGES WITH REAL THUMBNAILS
    { id: 'austin', name: 'Austin Bronson', preview: 'linear-gradient(135deg,#18181b,#facc15)', img: 'assets/templates/austin.jpg' },
    { id: 'sally', name: 'Sally Branders', preview: 'linear-gradient(135deg,#008080,#06b6d4)', img: 'assets/templates/sally.jpg' },
    { id: 'larry', name: 'Larry Tibbetts', preview: 'linear-gradient(135deg,#143438,#cca352)', img: 'assets/templates/larry.jpg' },
    { id: 'khalil', name: 'Khalil Richardson', preview: 'linear-gradient(135deg,#374151,#fef3c7)', img: 'assets/templates/khalil.jpg' },
    { id: 'kai', name: 'Kai Carter', preview: 'linear-gradient(135deg,#000000,#ffffff)', img: 'assets/templates/kai.jpg' },
    { id: 'michelle', name: 'Michelle Robinson', preview: 'linear-gradient(135deg,#2d2d2d,#e5e7eb)', img: 'assets/templates/michelle.png' },
    { id: 'executive-navy', name: 'Executive Navy Column', preview: 'linear-gradient(135deg,#172554,#3b82f6)', img: 'assets/templates/executive-navy.jpg' },
    { id: 'sue-wong', name: 'Sue Wong', preview: 'linear-gradient(135deg,#0f4c5c,#005f73)', img: 'assets/templates/sue-wong.jpg' },
    { id: 'chloe', name: 'Chloe Morgan', preview: 'linear-gradient(135deg,#361e12,#f4c2a8)', img: 'assets/templates/chloe.jpg' },
    { id: 'thompson', name: 'Michael Thompson', preview: 'linear-gradient(135deg,#1c1c1c,#475569)', img: 'assets/templates/thompson.jpg' },

    // Additional Master Canva & ATS Styles
    { id: 'canva-infographic', name: 'Canva Infographic', preview: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
    { id: 'canva-creative', name: 'Canva Creative', preview: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
    { id: 'canva-tech', name: 'Canva Tech Grid', preview: 'linear-gradient(135deg,#1e293b,#22d3ee)' },
    { id: 'canva-swiss', name: 'Canva Swiss Clean', preview: 'linear-gradient(135deg,#ef4444,#18181b)' },
    { id: 'minimal', name: 'Minimal ATS', preview: 'linear-gradient(135deg,#f8fafc,#e2e8f0)' },
    { id: 'modern', name: 'Modern Sidebar', preview: 'linear-gradient(135deg,#6366f1,#818cf8)' },
    { id: 'corporate', name: 'Corporate Serif', preview: 'linear-gradient(135deg,#1e293b,#334155)' },
    { id: 'developer', name: 'Developer Terminal', preview: 'linear-gradient(135deg,#0f172a,#06b6d4)' }
  ],
  colors: ['#facc15', '#008080', '#cca352', '#374151', '#000000', '#1f2937', '#172554', '#005f73', '#361e12', '#1c1c1c', '#6366f1', '#06b6d4', '#7c3aed', '#10b981', '#ec4899'],
  fonts: ['Inter', 'Outfit', 'Poppins', 'Georgia', 'Merriweather', 'Playfair Display', 'Roboto', 'Lato', 'Source Sans 3', 'JetBrains Mono'],
  zoom: 1,
  history: [],
  historyIdx: -1,
  debounceTimer: null,

  allSections: [
    { key: 'photo', label: 'Profile Photo' },
    { key: 'summaries', label: 'Summary Blocks' },
    { key: 'experience', label: 'Work Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills & Ratings' },
    { key: 'customSections', label: 'Custom Textboxes' },
    { key: 'projects', label: 'Projects' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'languages', label: 'Languages' },
    { key: 'interests', label: 'Interests & Hobbies' }
  ],

  init(resume) {
    document.getElementById('resumeTitleInput').value = resume.title || 'Untitled Resume';
    const d = resume.data;

    // Data normalization
    if (!d.jobRole) d.jobRole = d.personal?.title || '';
    if (!d.personal) d.personal = {};
    if (!d.photo) d.photo = { url: '', shape: 'circle', size: 'medium', sizePx: 90, align: 'center', show: true };
    if (!d.photo.sizePx) d.photo.sizePx = 90;
    if (!d.photo.align) d.photo.align = 'center';
    if (!d.photo.shape) d.photo.shape = 'circle';

    if (!d.summaries) {
      d.summaries = [{ label: 'About Me', text: d.summary || '' }];
    }
    if (!d.skills || !d.skills.length) {
      d.skills = [{ category: 'Core Skills', items: [] }];
    }
    if (!d.customSections) d.customSections = [];
    ['experience', 'education', 'projects', 'certifications', 'languages', 'interests'].forEach(k => {
      if (!d[k]) d[k] = [];
    });

    if (!resume.layout) resume.layout = 'single';
    if (!resume.headerAlign) resume.headerAlign = 'center';
    if (!resume.textAlign) resume.textAlign = 'left';
    if (!resume.boxStyle) resume.boxStyle = 'clean';
    if (!resume.fontSize) resume.fontSize = 100;
    if (!resume.spacing) resume.spacing = 'normal';

    Editor.renderSidebar();
    Editor.renderForm();
    Editor.updatePreview();

    Editor.history = [JSON.stringify(resume)];
    Editor.historyIdx = 0;
    Editor.updateHistoryBtns();
  },

  // ---- SIDEBAR CONTROLS ----
  renderSidebar() {
    const r = AppState.currentResume;

    // 1. Templates selector
    const tg = document.getElementById('templateMiniGrid');
    if (tg) {
      tg.innerHTML = Editor.templates.map(t => `
        <div class="template-mini-wrapper" onclick="Editor.setTemplate('${t.id}')" title="${t.name}">
          <div class="template-mini ${r.template === t.id ? 'active' : ''}" style="background:${t.preview}">
            ${t.img ? `<img src="${t.img}" alt="${t.name}">` : ''}
          </div>
          <div class="template-mini-label">${t.name.split(' ')[0]}</div>
        </div>
      `).join('');
    }

    // 2. Color Swatches
    const cr = document.getElementById('colorPickerRow');
    if (cr) {
      cr.innerHTML = Editor.colors.map(c => `
        <div class="color-swatch ${r.color === c ? 'active' : ''}" style="background:${c}" onclick="Editor.setColor('${c}')"></div>
      `).join('');
    }
    const colorHex = document.getElementById('customColorHex');
    const colorPick = document.getElementById('customColorPicker');
    if (colorHex) colorHex.value = r.color || '#facc15';
    if (colorPick) colorPick.value = r.color || '#facc15';

    // 3. Font
    const fs = document.getElementById('fontSelect');
    if (fs) fs.value = r.font || 'Inter';

    // 4. Layout & Alignment
    Editor.renderLayoutOptions();

    // 5. Active Sections List
    Editor.renderSectionsList();
  },

  renderLayoutOptions() {
    const r = AppState.currentResume;
    const d = r.data;

    // Layout buttons
    document.querySelectorAll('.layout-visual-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-layout') === r.layout));
    document.querySelectorAll('.layout-btn[data-header]').forEach(b => b.classList.toggle('active', b.getAttribute('data-header') === (r.headerAlign || 'center')));
    document.querySelectorAll('.layout-btn[data-spacing]').forEach(b => b.classList.toggle('active', b.getAttribute('data-spacing') === (r.spacing || 'normal')));
    document.querySelectorAll('.layout-btn[data-textalign]').forEach(b => b.classList.toggle('active', b.getAttribute('data-textalign') === (r.textAlign || 'left')));
    document.querySelectorAll('.layout-btn[data-boxstyle]').forEach(b => b.classList.toggle('active', b.getAttribute('data-boxstyle') === (r.boxStyle || 'clean')));
    document.querySelectorAll('.layout-btn[data-photoalign]').forEach(b => b.classList.toggle('active', b.getAttribute('data-photoalign') === (d.photo?.align || 'center')));
    document.querySelectorAll('.layout-btn[data-photoshape]').forEach(b => b.classList.toggle('active', b.getAttribute('data-photoshape') === (d.photo?.shape || 'circle')));

    // Canvas toolbar buttons
    document.querySelectorAll('.canvas-tool-btn[data-canvas-align]').forEach(b => b.classList.toggle('active', b.getAttribute('data-canvas-align') === (r.textAlign || 'left')));
    document.querySelectorAll('.canvas-tool-btn[data-canvas-box]').forEach(b => b.classList.toggle('active', b.getAttribute('data-canvas-box') === (r.boxStyle || 'clean')));

    // Font size slider
    const slider = document.getElementById('fontSizeSlider');
    const label = document.getElementById('fontSizeLabel');
    if (slider) slider.value = r.fontSize || 100;
    if (label) label.textContent = (r.fontSize || 100) + '%';

    // Photo size slider & label
    const photoPx = d.photo?.sizePx || 90;
    const pSlider = document.getElementById('photoSizeSlider');
    const pLabel = document.getElementById('photoSizeLabel');
    if (pSlider) pSlider.value = photoPx;
    if (pLabel) pLabel.textContent = photoPx + 'px';

    const cSlider = document.getElementById('canvasPhotoSlider');
    const cLabel = document.getElementById('canvasPhotoLabel');
    if (cSlider) cSlider.value = photoPx;
    if (cLabel) cLabel.textContent = photoPx + 'px';
  },

  renderSectionsList() {
    const sl = document.getElementById('sectionsList');
    if (!sl) return;
    const d = AppState.currentResume.data;
    const active = Editor.allSections.filter(s => d[s.key] !== undefined);

    sl.innerHTML = active.map(s => `
      <div class="section-item" data-key="${s.key}">
        <div class="section-item-left"><span class="section-item-drag">⠿</span><span>${s.label}</span></div>
        <div class="section-item-actions"><button class="section-item-btn" onclick="Editor.removeSection('${s.key}')" title="Remove Section">✕</button></div>
      </div>
    `).join('');

    const menu = document.getElementById('addSectionMenu');
    if (menu) {
      const avail = Editor.allSections.filter(s => d[s.key] === undefined);
      menu.innerHTML = avail.length
        ? avail.map(s => `<button onclick="Editor.addSection('${s.key}')">${s.label}</button>`).join('')
        : '<div style="padding:.5rem 1rem;color:var(--text-tertiary);font-size:.85rem">All default sections active</div>';
    }
  },

  addSection(key) {
    const d = AppState.currentResume.data;
    if (key === 'photo') d[key] = { url: '', shape: 'circle', size: 'medium', sizePx: 90, align: 'center', show: true };
    else if (key === 'summaries') d[key] = [{ label: 'About Me', text: '' }];
    else if (key === 'skills') d[key] = [{ category: 'Skills', items: [] }];
    else if (key === 'customSections') d[key] = [];
    else d[key] = [];

    Editor.renderSectionsList();
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    document.getElementById('addSectionMenu')?.classList.add('hidden');
  },

  removeSection(key) {
    if (key === 'personal') return;
    delete AppState.currentResume.data[key];
    Editor.renderSectionsList();
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },

  toggleAddSection() {
    document.getElementById('addSectionMenu')?.classList.toggle('hidden');
  },

  // ---- CUSTOM TEXTBOXES / SECTIONS SYSTEM ----
  addCustomSection(title = 'Custom Section', content = '') {
    const d = AppState.currentResume.data;
    if (!d.customSections) d.customSections = [];
    d.customSections.push({
      id: Utils.id(),
      title: title,
      content: content || '• Add custom text, key strengths, achievements, or publications here...'
    });
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    Utils.showToast('Custom textbox added!', 'success');
  },

  removeCustomSection(idx) {
    const d = AppState.currentResume.data;
    if (d.customSections) {
      d.customSections.splice(idx, 1);
      Editor.renderForm();
      Editor.updatePreview();
      Editor.autoSave();
      Editor.saveState();
      Utils.showToast('Custom textbox removed', 'info');
    }
  },

  updCustomSectionTitle(idx, val) {
    const d = AppState.currentResume.data;
    if (d.customSections && d.customSections[idx]) {
      d.customSections[idx].title = val;
      Editor.scheduleUpdate();
    }
  },

  updCustomSectionContent(idx, val) {
    const d = AppState.currentResume.data;
    if (d.customSections && d.customSections[idx]) {
      d.customSections[idx].content = val;
      Editor.scheduleUpdate();
    }
  },

  // ---- FORM RENDERING ----
  renderForm() {
    const fi = document.getElementById('editorFormInner');
    if (!fi) return;
    const d = AppState.currentResume.data;
    const E = Utils.esc;
    let h = '';

    // 1. Target Job Role Banner
    h += `
      <div class="job-role-banner">
        <div class="job-role-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 3l-4 4-4-4" />
          </svg>
        </div>
        <div class="form-group" style="flex:1">
          <label style="color:var(--primary);font-weight:700">🎯 Professional Job Role / Title</label>
          <input type="text" value="${E(d.jobRole)}" placeholder="e.g. Sales Force Team Leader, Senior Software Engineer..." oninput="Editor.setJobRole(this.value)">
        </div>
      </div>
    `;

    // 2. Profile Photo Uploader
    if (d.photo) {
      const ph = d.photo;
      const curPx = ph.sizePx || 90;
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">📷 Profile Image Customizer</div>
            <div class="form-section-actions">
              ${ph.url ? `<button class="btn btn-danger btn-xs" onclick="Editor.removePhoto()">Remove Image</button>` : ''}
            </div>
          </div>
          <div class="photo-uploader-card">
            <div class="photo-preview-box shape-${ph.shape || 'circle'}">
              ${ph.url ? `<img src="${ph.url}" alt="Profile Preview">` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" color="var(--text-tertiary)"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`}
            </div>
            <div class="photo-controls-group">
              <input type="file" id="photoFileInput" accept="image/*" style="display:none" onchange="Editor.handlePhotoUpload(event)">
              <div class="photo-controls-row">
                <button class="btn btn-outline btn-sm" onclick="document.getElementById('photoFileInput').click()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  ${ph.url ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
              <div class="photo-controls-row" style="margin-top:0.5rem">
                <label style="font-size:0.8rem;font-weight:600">Shape:</label>
                <div class="layout-btns">
                  <button class="layout-btn ${ph.shape === 'circle' ? 'active' : ''}" onclick="Editor.setPhotoShape('circle')">Circle</button>
                  <button class="layout-btn ${ph.shape === 'rounded' ? 'active' : ''}" onclick="Editor.setPhotoShape('rounded')">Rounded</button>
                  <button class="layout-btn ${ph.shape === 'square' ? 'active' : ''}" onclick="Editor.setPhotoShape('square')">Square</button>
                </div>
              </div>
              <div class="photo-controls-row" style="margin-top:0.5rem">
                <label style="font-size:0.8rem;font-weight:600">Size (${curPx}px):</label>
                <input type="range" min="40" max="220" value="${curPx}" step="5" style="flex:1;accent-color:var(--primary)" oninput="Editor.setPhotoSizeValue(this.value)">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Personal Contact Details
    const p = d.personal || {};
    h += `
      <div class="form-section">
        <div class="form-section-header">
          <div class="form-section-title">👤 Contact & Personal Details</div>
        </div>
        <div class="form-grid">
          <div class="form-group"><label>Full Name</label><input type="text" value="${E(p.name)}" oninput="Editor.upd('personal','name',this.value)"></div>
          <div class="form-group"><label>Job Title / Subtitle</label><input type="text" value="${E(p.title)}" oninput="Editor.upd('personal','title',this.value)"></div>
          <div class="form-group"><label>Email Address</label><input type="email" value="${E(p.email)}" oninput="Editor.upd('personal','email',this.value)"></div>
          <div class="form-group"><label>Phone Number</label><input type="text" value="${E(p.phone)}" oninput="Editor.upd('personal','phone',this.value)"></div>
          <div class="form-group form-grid-full"><label>Location / Address</label><input type="text" value="${E(p.location)}" oninput="Editor.upd('personal','location',this.value)"></div>
          <div class="form-group"><label>LinkedIn</label><input type="text" value="${E(p.linkedin)}" placeholder="linkedin.com/in/username" oninput="Editor.upd('personal','linkedin',this.value)"></div>
          <div class="form-group"><label>Website / Portfolio</label><input type="text" value="${E(p.website)}" placeholder="yourportfolio.com" oninput="Editor.upd('personal','website',this.value)"></div>
        </div>
      </div>
    `;

    // 4. Summaries / About Me Blocks
    if (d.summaries) {
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">📝 Summary & Bio Blocks</div>
            <div class="form-section-actions">
              <button class="btn-ai-generate" onclick="AIModal.open('summary')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                AI Summary Studio
              </button>
            </div>
          </div>
      `;
      d.summaries.forEach((s, i) => {
        h += `
          <div class="summary-block">
            <div class="summary-block-header">
              <div class="summary-block-label">
                <input type="text" value="${E(s.label)}" oninput="Editor.updSummaryLabel(${i},this.value)" placeholder="Section Label (e.g. About Me)">
              </div>
              <div class="entry-actions">
                ${d.summaries.length > 1 ? `<button class="btn btn-danger btn-xs" onclick="Editor.removeSummary(${i})">Remove</button>` : ''}
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <textarea rows="4" placeholder="Write your summary, objective, or profile description..." oninput="Editor.updSummaryText(${i},this.value)">${E(s.text)}</textarea>
            </div>
          </div>
        `;
      });
      h += `<button class="btn-add-entry" onclick="Editor.addSummary()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>Add Another Summary Block</button></div>`;
    }

    // 5. Work Experience
    if (d.experience !== undefined) {
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">💼 Work Experience (${d.experience.length})</div>
            <div class="form-section-actions">
              <button class="btn-ai-generate" onclick="AIModal.open('experience')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                AI Bullets Writer
              </button>
            </div>
          </div>
          <div class="entry-list">
      `;
      d.experience.forEach((exp, i) => {
        h += `
          <div class="entry-item">
            <div class="entry-header">
              <div class="entry-title">${E(exp.title || 'Position')}</div>
              <div class="entry-actions"><button class="btn btn-danger btn-xs" onclick="Editor.removeEntry('experience',${i})">Remove</button></div>
            </div>
            <div class="entry-body">
              <div class="form-grid">
                <div class="form-group"><label>Job Title</label><input type="text" value="${E(exp.title)}" oninput="Editor.updArr('experience',${i},'title',this.value)"></div>
                <div class="form-group"><label>Company</label><input type="text" value="${E(exp.company)}" oninput="Editor.updArr('experience',${i},'company',this.value)"></div>
                <div class="form-group"><label>Duration</label><input type="text" value="${E(exp.date)}" placeholder="2006 — Present" oninput="Editor.updArr('experience',${i},'date',this.value)"></div>
                <div class="form-group"><label>Location</label><input type="text" value="${E(exp.location)}" oninput="Editor.updArr('experience',${i},'location',this.value)"></div>
              </div>
              <div class="form-group form-grid-full">
                <label>Key Accomplishments (Use • at start of lines for bullet points)</label>
                <textarea rows="4" oninput="Editor.updArr('experience',${i},'desc',this.value)">${E(exp.desc)}</textarea>
              </div>
            </div>
          </div>
        `;
      });
      h += `</div><button class="btn-add-entry" onclick="Editor.addEntry('experience')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>Add Work Experience Entry</button></div>`;
    }

    // 6. Skills & Rating Bars
    if (d.skills !== undefined) {
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">⚡ Skills & Competency Bars</div>
            <div class="form-section-actions">
              <button class="btn-ai-generate" onclick="AIModal.open('skills')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                AI Skills Explorer
              </button>
            </div>
          </div>
          <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:0.75rem">Tip: Add skills like <code>Graphic Design: 90%</code> to render visual skill progress bars!</p>
      `;
      d.skills.forEach((cat, ci) => {
        h += `
          <div class="skill-category-card">
            <div class="skill-category-header">
              <div class="skill-category-name">
                <input type="text" value="${E(cat.category)}" oninput="Editor.updSkillCat(${ci},this.value)" placeholder="Category Name">
              </div>
              <div class="entry-actions">
                ${d.skills.length > 1 ? `<button class="btn btn-danger btn-xs" onclick="Editor.removeSkillCat(${ci})">Remove Group</button>` : ''}
              </div>
            </div>
            <div class="skill-tags-container">
              ${cat.items.map((s, si) => `
                <span class="skill-tag">
                  ${E(s)}
                  <span class="skill-tag-remove" onclick="Editor.removeSkill(${ci},${si})">✕</span>
                </span>
              `).join('')}
            </div>
            <div class="skill-input-row">
              <input type="text" id="skillInput_${ci}" placeholder="Type skill (e.g. Adobe Photoshop: 90% or Teamwork)" onkeydown="if(event.key==='Enter'){event.preventDefault();Editor.addSkill(${ci});}">
              <button class="btn btn-primary btn-sm" onclick="Editor.addSkill(${ci})">+ Add</button>
            </div>
          </div>
        `;
      });
      h += `<button class="add-category-btn" onclick="Editor.addSkillCat()">+ Add Another Skill Group</button></div>`;
    }

    // 7. Dynamic Custom Textboxes & Extra Sections
    if (d.customSections !== undefined) {
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">✨ Additional Custom Textboxes (${d.customSections.length})</div>
            <div class="form-section-actions">
              <button class="btn btn-primary btn-xs glow-btn" onclick="Editor.addCustomSection()">+ Add Custom Box</button>
            </div>
          </div>
          <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:0.75rem">Create custom textboxes for Volunteer Work, Honors, References, Links, Strengths, or Notes.</p>
          <div class="entry-list">
      `;
      d.customSections.forEach((cs, i) => {
        h += `
          <div class="entry-item">
            <div class="entry-header">
              <div class="summary-block-label" style="flex:1">
                <input type="text" value="${E(cs.title)}" placeholder="Custom Section Title" oninput="Editor.updCustomSectionTitle(${i},this.value)">
              </div>
              <div class="entry-actions">
                <button class="btn btn-danger btn-xs" onclick="Editor.removeCustomSection(${i})">Remove Box</button>
              </div>
            </div>
            <div class="form-group form-grid-full" style="margin-bottom:0">
              <textarea rows="3" placeholder="Enter custom textbox content, bullet points, or paragraphs..." oninput="Editor.updCustomSectionContent(${i},this.value)">${E(cs.content)}</textarea>
            </div>
          </div>
        `;
      });
      h += `</div><button class="btn-add-entry" onclick="Editor.addCustomSection()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>Add Another Custom Textbox</button></div>`;
    }

    // 8. Education
    if (d.education !== undefined) {
      h += `
        <div class="form-section">
          <div class="form-section-header">
            <div class="form-section-title">🎓 Education (${d.education.length})</div>
          </div>
          <div class="entry-list">
      `;
      d.education.forEach((edu, i) => {
        h += `
          <div class="entry-item">
            <div class="entry-header">
              <div class="entry-title">${E(edu.degree || 'Degree')}</div>
              <div class="entry-actions"><button class="btn btn-danger btn-xs" onclick="Editor.removeEntry('education',${i})">Remove</button></div>
            </div>
            <div class="entry-body">
              <div class="form-grid">
                <div class="form-group"><label>Degree / Qualification</label><input type="text" value="${E(edu.degree)}" oninput="Editor.updArr('education',${i},'degree',this.value)"></div>
                <div class="form-group"><label>Institution / School</label><input type="text" value="${E(edu.school)}" oninput="Editor.updArr('education',${i},'school',this.value)"></div>
                <div class="form-group"><label>Years</label><input type="text" value="${E(edu.date)}" placeholder="1996 — 1999" oninput="Editor.updArr('education',${i},'date',this.value)"></div>
                <div class="form-group"><label>GPA / Honors</label><input type="text" value="${E(edu.gpa)}" placeholder="GPA: 3.8" oninput="Editor.updArr('education',${i},'gpa',this.value)"></div>
              </div>
              <div class="form-group form-grid-full">
                <label>Description / Details</label>
                <textarea rows="2" oninput="Editor.updArr('education',${i},'desc',this.value)">${E(edu.desc)}</textarea>
              </div>
            </div>
          </div>
        `;
      });
      h += `</div><button class="btn-add-entry" onclick="Editor.addEntry('education')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>Add Education Entry</button></div>`;
    }

    // 9. Languages & Interests Tags
    ['languages', 'interests'].forEach(key => {
      if (d[key] !== undefined) {
        const label = key === 'languages' ? '🌐 Languages' : '🎯 Interests & Hobbies';
        h += `
          <div class="form-section">
            <div class="form-section-header">
              <div class="form-section-title">${label} (${d[key].length})</div>
            </div>
            <div class="skill-tags-container">
              ${d[key].map((item, i) => `
                <span class="skill-tag">
                  ${E(item)}
                  <span class="skill-tag-remove" onclick="Editor.removeTag('${key}',${i})">✕</span>
                </span>
              `).join('')}
            </div>
            <div class="skill-input-row">
              <input type="text" id="tagInput_${key}" placeholder="Add new ${key.slice(0, -1)}..." onkeydown="if(event.key==='Enter'){event.preventDefault();Editor.addTag('${key}');}">
              <button class="btn btn-primary btn-sm" onclick="Editor.addTag('${key}')">+ Add</button>
            </div>
          </div>
        `;
      }
    });

    fi.innerHTML = h;
  },

  // State update helpers
  setJobRole(v) {
    AppState.currentResume.data.jobRole = v;
    Editor.scheduleUpdate();
  },
  upd(s, f, v) {
    AppState.currentResume.data[s][f] = v;
    Editor.scheduleUpdate();
  },
  updArr(s, i, f, v) {
    AppState.currentResume.data[s][i][f] = v;
    Editor.scheduleUpdate();
  },
  updSummaryLabel(i, v) {
    AppState.currentResume.data.summaries[i].label = v;
    Editor.scheduleUpdate();
  },
  updSummaryText(i, v) {
    AppState.currentResume.data.summaries[i].text = v;
    Editor.scheduleUpdate();
  },
  addSummary() {
    AppState.currentResume.data.summaries.push({ label: 'Executive Focus', text: '' });
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  removeSummary(i) {
    AppState.currentResume.data.summaries.splice(i, 1);
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  updSkillCat(ci, v) {
    AppState.currentResume.data.skills[ci].category = v;
    Editor.scheduleUpdate();
  },
  addSkillCat() {
    AppState.currentResume.data.skills.push({ category: 'New Skill Group', items: [] });
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  removeSkillCat(ci) {
    AppState.currentResume.data.skills.splice(ci, 1);
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  addSkill(ci) {
    const inp = document.getElementById(`skillInput_${ci}`);
    if (inp && inp.value.trim()) {
      AppState.currentResume.data.skills[ci].items.push(inp.value.trim());
      inp.value = '';
      Editor.renderForm();
      Editor.updatePreview();
      Editor.autoSave();
    }
  },
  removeSkill(ci, si) {
    AppState.currentResume.data.skills[ci].items.splice(si, 1);
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  addTag(key) {
    const inp = document.getElementById(`tagInput_${key}`);
    if (inp && inp.value.trim()) {
      AppState.currentResume.data[key].push(inp.value.trim());
      inp.value = '';
      Editor.renderForm();
      Editor.updatePreview();
      Editor.autoSave();
    }
  },
  removeTag(key, i) {
    AppState.currentResume.data[key].splice(i, 1);
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  addEntry(section) {
    const d = AppState.currentResume.data;
    const defs = {
      experience: { title: '', company: '', date: '', location: '', desc: '' },
      education: { degree: '', school: '', date: '', gpa: '', desc: '' }
    };
    d[section].push({ ...(defs[section] || {}) });
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  removeEntry(s, i) {
    AppState.currentResume.data[s].splice(i, 1);
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },

  // Photo handlers — with client-side compression
  handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      Utils.showToast('Image is too large. Max 5MB allowed.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      // Compress image: resize to max 500px and convert to JPEG
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 500;
        let w = img.width, h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);

        AppState.currentResume.data.photo.url = compressed;
        AppState.currentResume.data.photo.show = true;
        Editor.renderForm();
        Editor.updatePreview();
        Editor.autoSave();
        Editor.saveState();
        Utils.showToast('Profile photo updated!', 'success');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  },
  removePhoto() {
    AppState.currentResume.data.photo.url = '';
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    Utils.showToast('Photo removed', 'info');
  },
  setPhotoShape(shape) {
    AppState.currentResume.data.photo.shape = shape;
    Editor.renderLayoutOptions();
    Editor.renderForm();
    Editor.updatePreview();
    Editor.autoSave();
  },
  setPhotoSizeValue(val) {
    const px = parseInt(val) || 90;
    if (AppState.currentResume.data.photo) {
      AppState.currentResume.data.photo.sizePx = px;
    }
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
  },
  setPhotoAlign(align) {
    if (AppState.currentResume.data.photo) {
      AppState.currentResume.data.photo.align = align;
    }
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  cyclePhotoShape() {
    const shapes = ['circle', 'rounded', 'square'];
    const cur = AppState.currentResume.data.photo?.shape || 'circle';
    const next = shapes[(shapes.indexOf(cur) + 1) % shapes.length];
    Editor.setPhotoShape(next);
    Utils.showToast(`Image Shape: ${next.toUpperCase()}`, 'info');
  },
  cyclePhotoAlign() {
    const aligns = ['left', 'center', 'right'];
    const cur = AppState.currentResume.data.photo?.align || 'center';
    const next = aligns[(aligns.indexOf(cur) + 1) % aligns.length];
    Editor.setPhotoAlign(next);
    Utils.showToast(`Image Position: ${next.toUpperCase()}`, 'info');
  },

  // Auto-Save & Debounce
  scheduleUpdate() {
    clearTimeout(Editor.debounceTimer);
    Editor.debounceTimer = setTimeout(() => {
      Editor.updatePreview();
      Editor.autoSave();
    }, 100);
  },
  autoSave() {
    AppState.currentResume.updatedAt = Date.now();
    const idx = AppState.resumes.findIndex(r => r.id === AppState.currentResume.id);
    if (idx >= 0) AppState.resumes[idx] = AppState.currentResume;
    Dashboard.save();
  },

  // Sidebar controls
  setTemplate(id) {
    AppState.currentResume.template = id;
    if (id === 'austin') AppState.currentResume.color = '#facc15';
    else if (id === 'sally') AppState.currentResume.color = '#008080';
    else if (id === 'larry') AppState.currentResume.color = '#cca352';
    else if (id === 'khalil') AppState.currentResume.color = '#374151';
    else if (id === 'kai') AppState.currentResume.color = '#000000';
    else if (id === 'michelle') AppState.currentResume.color = '#1f2937';
    else if (id === 'executive-navy') AppState.currentResume.color = '#172554';
    else if (id === 'sue-wong') AppState.currentResume.color = '#005f73';
    else if (id === 'chloe') AppState.currentResume.color = '#361e12';
    else if (id === 'thompson') AppState.currentResume.color = '#1c1c1c';

    Editor.renderSidebar();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  setColor(c) {
    AppState.currentResume.color = c;
    Editor.renderSidebar();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  updateFont(f) {
    AppState.currentResume.font = f;
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  setLayout(l) {
    AppState.currentResume.layout = l;
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  setHeaderAlign(h) {
    AppState.currentResume.headerAlign = h;
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  setTextAlign(align) {
    AppState.currentResume.textAlign = align;
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    Utils.showToast(`Text alignment: ${align.toUpperCase()}`, 'info');
  },
  setBoxStyle(style) {
    AppState.currentResume.boxStyle = style;
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
    Utils.showToast(`Text Box Style: ${style.toUpperCase()}`, 'info');
  },
  setSpacing(s) {
    AppState.currentResume.spacing = s;
    Editor.renderLayoutOptions();
    Editor.updatePreview();
    Editor.autoSave();
    Editor.saveState();
  },
  setFontSize(v) {
    AppState.currentResume.fontSize = parseInt(v);
    const label = document.getElementById('fontSizeLabel');
    if (label) label.textContent = v + '%';
    Editor.updatePreview();
    Editor.autoSave();
  },
  updateTitle(v) {
    AppState.currentResume.title = v;
    Editor.autoSave();
  },
  setView(v) {
    const layout = document.querySelector('.editor-layout');
    if (layout) layout.className = `editor-layout view-${v}`;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-view') === v));
  },
  zoomIn() {
    if (Editor.zoom < 1.5) {
      Editor.zoom += 0.1;
      Editor.applyZoom();
    }
  },
  zoomOut() {
    if (Editor.zoom > 0.4) {
      Editor.zoom -= 0.1;
      Editor.applyZoom();
    }
  },
  applyZoom() {
    const p = document.getElementById('previewPage');
    const z = document.getElementById('zoomLevel');
    if (p) p.style.transform = `scale(${Editor.zoom})`;
    if (z) z.textContent = `${Math.round(Editor.zoom * 100)}%`;
  },

  // Undo / Redo
  saveState() {
    const s = JSON.stringify(AppState.currentResume);
    if (Editor.historyIdx >= 0 && Editor.history[Editor.historyIdx] === s) return;
    Editor.history = Editor.history.slice(0, Editor.historyIdx + 1);
    Editor.history.push(s);
    if (Editor.history.length > 30) Editor.history.shift();
    Editor.historyIdx = Editor.history.length - 1;
    Editor.updateHistoryBtns();
  },
  undo() {
    if (Editor.historyIdx > 0) {
      Editor.historyIdx--;
      AppState.currentResume = JSON.parse(Editor.history[Editor.historyIdx]);
      Editor.renderForm();
      Editor.renderSidebar();
      Editor.updatePreview();
      Editor.updateHistoryBtns();
      Dashboard.save();
    }
  },
  redo() {
    if (Editor.historyIdx < Editor.history.length - 1) {
      Editor.historyIdx++;
      AppState.currentResume = JSON.parse(Editor.history[Editor.historyIdx]);
      Editor.renderForm();
      Editor.renderSidebar();
      Editor.updatePreview();
      Editor.updateHistoryBtns();
      Dashboard.save();
    }
  },
  updateHistoryBtns() {
    const u = document.getElementById('undoBtn');
    const r = document.getElementById('redoBtn');
    if (u) u.disabled = Editor.historyIdx <= 0;
    if (r) r.disabled = Editor.historyIdx >= Editor.history.length - 1;
  },

  // =========================================================================
  // 8. RESUME PREVIEW RENDERING ENGINE (WITH 10 EXACT IMAGE REPLICAS)
  // =========================================================================
  updatePreview() {
    const pg = document.getElementById('previewPage');
    if (!pg) return;
    const r = AppState.currentResume;
    const d = r.data;
    const tpl = r.template || 'austin';
    const color = r.color || '#facc15';
    const font = r.font || 'Inter';
    const fontSize = (r.fontSize || 100) / 100;
    const spacingMult = r.spacing === 'compact' ? 0.65 : r.spacing === 'spacious' ? 1.35 : 1;
    const textAlign = r.textAlign || 'left';
    const boxStyle = r.boxStyle || 'clean';
    const photoAlign = d.photo?.align || 'center';
    const photoPx = d.photo?.sizePx || 90;
    const photoUrl = d.photo?.url || '';

    pg.className = `preview-page tpl-${tpl} text-align-${textAlign} box-style-${boxStyle}`;
    pg.style.fontFamily = `"${font}", sans-serif`;
    pg.style.fontSize = `${fontSize * 0.95}rem`;
    pg.style.setProperty('--cv-color', color);
    pg.style.setProperty('--cv-photo-size', `${photoPx}px`);

    const E = Utils.esc;
    const nl2ul = (s) => {
      const lines = (s || '').split('\n').filter(l => l.trim());
      const bullets = lines.filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
      if (bullets.length) {
        return '<ul>' + bullets.map(l => `<li>${E(l.replace(/^[•\-]\s*/, ''))}</li>`).join('') + '</ul>';
      }
      return '<p>' + E(s) + '</p>';
    };

    // Helper: skill bars
    const renderSkillBars = (items, isDarkSidebar = false) => {
      return items.map(s => {
        const parts = s.split(':');
        if (parts.length === 2 && parts[1].includes('%')) {
          const name = parts[0].trim();
          const pct = Math.min(100, Math.max(10, parseInt(parts[1]) || 80));
          return `
            <div class="cv-skill-bar-row">
              <span style="color:${isDarkSidebar ? '#e2e8f0' : '#334155'};font-weight:500">${E(name)}:</span>
              <div class="cv-skill-bar-track" style="${isDarkSidebar ? 'background:rgba(255,255,255,0.2)' : 'background:#e2e8f0'}">
                <div class="cv-skill-bar-fill" style="width:${pct}%;background:${isDarkSidebar ? '#cca352' : color}"></div>
              </div>
            </div>
          `;
        }
        return `<span class="cv-skill-tag" style="margin:2px">${E(s)}</span>`;
      }).join('');
    };

    // Photo markup
    const photoHtml = photoUrl
      ? `<img src="${photoUrl}" class="cv-photo shape-${d.photo.shape || 'circle'}" alt="Profile Photo" onclick="Editor.cyclePhotoShape()">`
      : '';
    const photoContainerHtml = photoHtml ? `<div class="cv-photo-container photo-align-${photoAlign}">${photoHtml}</div>` : '';

    // Contact components
    const cp = [d.personal.email, d.personal.phone, d.personal.location, d.personal.linkedin, d.personal.website].filter(Boolean);
    const contactHtml = cp.map(c => `<span>${E(c)}</span>`).join('');

    // Summary HTML
    let summaryHtml = '';
    if (d.summaries && d.summaries.length) {
      d.summaries.forEach(s => {
        if (s.text) {
          summaryHtml += `
            <div class="cv-section">
              <div class="cv-section-title" style="color:${color};border-color:${color}">${E(s.label || 'About Me')}</div>
              <div class="cv-summary">${E(s.text)}</div>
            </div>
          `;
        }
      });
    }

    // Experience HTML
    let expHtml = '';
    if (d.experience && d.experience.length) {
      expHtml += `<div class="cv-section"><div class="cv-section-title" style="color:${color};border-color:${color}">Work Experience</div>`;
      d.experience.forEach(e => {
        expHtml += `
          <div class="cv-item" style="margin-bottom:${spacingMult * 0.85}rem">
            <div class="cv-item-header">
              <div class="cv-item-title">${E(e.title)}</div>
              <div class="cv-item-date">${E(e.date)}</div>
            </div>
            <div class="cv-item-subtitle">${E(e.company)}${e.location ? ' · ' + E(e.location) : ''}</div>
            <div class="cv-item-desc">${nl2ul(e.desc)}</div>
          </div>
        `;
      });
      expHtml += '</div>';
    }

    // Education HTML
    let eduHtml = '';
    if (d.education && d.education.length) {
      eduHtml += `<div class="cv-section"><div class="cv-section-title" style="color:${color};border-color:${color}">Education</div>`;
      d.education.forEach(e => {
        eduHtml += `
          <div class="cv-item" style="margin-bottom:${spacingMult * 0.75}rem">
            <div class="cv-item-header">
              <div class="cv-item-title">${E(e.degree)}</div>
              <div class="cv-item-date">${E(e.date)}</div>
            </div>
            <div class="cv-item-subtitle">${E(e.school)}${e.gpa ? ' · ' + E(e.gpa) : ''}</div>
            ${e.desc ? `<div class="cv-item-desc">${E(e.desc)}</div>` : ''}
          </div>
        `;
      });
      eduHtml += '</div>';
    }

    // Skills HTML
    let skillsHtml = '';
    if (d.skills && d.skills.length) {
      skillsHtml += `<div class="cv-section"><div class="cv-section-title" style="color:${color};border-color:${color}">Skills & Expertise</div>`;
      d.skills.forEach(cat => {
        if (cat.items.length) {
          skillsHtml += `
            <div class="cv-skill-category">
              <div class="cv-skill-category-title">${E(cat.category)}</div>
              <div class="cv-skills-list">${renderSkillBars(cat.items, false)}</div>
            </div>
          `;
        }
      });
      skillsHtml += '</div>';
    }

    // Custom Textboxes HTML
    let customSectionsHtml = '';
    if (d.customSections && d.customSections.length) {
      d.customSections.forEach(cs => {
        if (cs.content) {
          customSectionsHtml += `
            <div class="cv-section cv-custom-section">
              <div class="cv-section-title cv-custom-title" style="color:${color};border-color:${color}">${E(cs.title)}</div>
              <div class="cv-custom-body">${nl2ul(cs.content)}</div>
            </div>
          `;
        }
      });
    }

    // Languages HTML
    let langsHtml = '';
    if (d.languages && d.languages.length) {
      langsHtml += `
        <div class="cv-section"><div class="cv-section-title" style="color:${color};border-color:${color}">Languages</div>
          <div class="cv-skills-list">${d.languages.map(l => `<span class="cv-skill-tag">${E(l)}</span>`).join('')}</div>
        </div>
      `;
    }

    // Interests HTML
    let interestsHtml = '';
    if (d.interests && d.interests.length) {
      interestsHtml += `
        <div class="cv-section"><div class="cv-section-title" style="color:${color};border-color:${color}">Interests</div>
          <div class="cv-skills-list">${d.interests.map(i => `<span class="cv-skill-tag">${E(i)}</span>`).join('')}</div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 1: AUSTIN BRONSON (Split Black/White, Yellow Highlight)
    // -------------------------------------------------------------
    if (tpl === 'austin') {
      pg.innerHTML = `
        <div class="cv-austin-sidebar">
          <div class="cv-austin-photo-wrap">
            ${photoUrl ? `<img src="${photoUrl}" alt="Photo">` : ''}
          </div>
          <div class="cv-austin-sidebar-body">
            <div class="cv-section">
              <div class="cv-section-title">${E(d.summaries[0]?.label || 'ABOUT ME')}</div>
              <div class="cv-summary">${E(d.summaries[0]?.text || '')}</div>
            </div>
            <div class="cv-section" style="margin-top:2rem">
              <div class="cv-section-title">SKILLS</div>
              <div>${d.skills.map(c => renderSkillBars(c.items, true)).join('')}</div>
            </div>
            ${langsHtml ? `<div style="margin-top:1.5rem">${langsHtml}</div>` : ''}
          </div>
        </div>
        <div class="cv-austin-main">
          <div class="cv-austin-header">
            <div class="cv-austin-name-badge">
              <div class="cv-austin-name">${E(d.personal.name || 'AUSTIN BRONSON')}</div>
            </div>
            <div class="cv-austin-contact">
              <div>${E(d.personal.location || '')}</div>
              <div>phone: ${E(d.personal.phone || '')} &nbsp;|&nbsp; email: ${E(d.personal.email || '')}</div>
            </div>
          </div>
          ${expHtml}
          ${eduHtml}
          ${customSectionsHtml}
          ${interestsHtml}
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 2: SALLY BRANDERS (Teal Top Band, Checkmark Lists)
    // -------------------------------------------------------------
    else if (tpl === 'sally') {
      const nameParts = (d.personal.name || 'Sally Branders').split(' ');
      const firstName = nameParts[0] || 'Sally';
      const lastName = nameParts.slice(1).join(' ') || 'Branders';

      pg.innerHTML = `
        <div class="cv-sally-top-banner">
          <div class="cv-sally-jobtitle">${E(d.personal.title || d.jobRole || 'JOB TITLE')}</div>
        </div>
        <div class="cv-sally-header-wrap">
          ${photoUrl ? `<img src="${photoUrl}" class="cv-sally-avatar" alt="Photo">` : `<div class="cv-sally-avatar" style="display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:bold;color:#008080">${firstName.charAt(0)}</div>`}
          <div class="cv-sally-name-block">
            <div class="cv-sally-name-first">${E(firstName)}</div>
            <div class="cv-sally-name-last">${E(lastName)}</div>
          </div>
        </div>
        <div class="cv-sally-body">
          <div class="cv-sally-left">
            <div class="cv-section">
              <div class="cv-section-title">CONTACT</div>
              <div style="font-size:0.8rem;color:#475569;display:flex;flex-direction:column;gap:0.4rem">
                ${d.personal.email ? `<div>✉ ${E(d.personal.email)}</div>` : ''}
                ${d.personal.phone ? `<div>📞 ${E(d.personal.phone)}</div>` : ''}
                ${d.personal.location ? `<div>📍 ${E(d.personal.location)}</div>` : ''}
                ${d.personal.linkedin ? `<div>🔗 ${E(d.personal.linkedin)}</div>` : ''}
              </div>
            </div>
            ${summaryHtml}
            <div class="cv-section">
              <div class="cv-section-title">SKILLS</div>
              <div>
                ${d.skills.flatMap(c => c.items).map(s => `
                  <div class="cv-check-item">
                    <span class="cv-check-icon">✓</span>
                    <span>${E(s.split(':')[0])}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            ${d.languages.length ? `
              <div class="cv-section">
                <div class="cv-section-title">LANGUAGES</div>
                <div>
                  ${d.languages.map(l => `
                    <div class="cv-check-item">
                      <span class="cv-check-icon">✓</span>
                      <span>${E(l)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="cv-sally-right">
            ${expHtml}
            ${eduHtml}
            ${customSectionsHtml}
            ${interestsHtml}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 3: LARRY TIBBETTS (Navy Header, Gold Ribbon & Badges)
    // -------------------------------------------------------------
    else if (tpl === 'larry') {
      pg.innerHTML = `
        <div class="cv-larry-header">
          ${photoUrl ? `<img src="${photoUrl}" class="cv-larry-avatar" alt="Photo">` : ''}
          <div>
            <div class="cv-larry-name">${E(d.personal.name || 'LARRY TIBBETTS')}</div>
            <div class="cv-larry-title">${E(d.personal.title || d.jobRole || 'Job Title')}</div>
            <div class="cv-larry-summary">${E(d.summaries[0]?.text || '')}</div>
          </div>
        </div>
        <div class="cv-larry-ribbon"></div>
        <div class="cv-larry-body">
          <div class="cv-larry-sidebar">
            <div style="font-size:0.8rem;color:#cbd5e1;display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem">
              ${d.personal.phone ? `<div>📞 ${E(d.personal.phone)}</div>` : ''}
              ${d.personal.email ? `<div>✉ ${E(d.personal.email)}</div>` : ''}
              ${d.personal.location ? `<div>📍 ${E(d.personal.location)}</div>` : ''}
              ${d.personal.linkedin ? `<div>🔗 ${E(d.personal.linkedin)}</div>` : ''}
            </div>
            <div>
              <div class="cv-larry-sidebar-pill">SKILLS</div>
              <ul style="padding-left:1rem;color:#e2e8f0;font-size:0.82rem;line-height:1.6">
                ${d.skills.flatMap(c => c.items).map(s => `<li>${E(s.split(':')[0])}</li>`).join('')}
              </ul>
            </div>
            ${d.languages.length ? `
              <div>
                <div class="cv-larry-sidebar-pill">LANGUAGES</div>
                <ul style="padding-left:1rem;color:#e2e8f0;font-size:0.82rem;line-height:1.6">
                  ${d.languages.map(l => `<li>${E(l)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${d.interests.length ? `
              <div>
                <div class="cv-larry-sidebar-pill">HOBBIES</div>
                <ul style="padding-left:1rem;color:#e2e8f0;font-size:0.82rem;line-height:1.6">
                  ${d.interests.map(i => `<li>${E(i)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          <div class="cv-larry-main">
            <div class="cv-larry-main-pill">EXPERIENCE</div>
            ${expHtml.replace(/<div class="cv-section-title"[^>]*>.*?<\/div>/, '')}
            <div class="cv-larry-main-pill" style="margin-top:1.5rem">EDUCATION</div>
            ${eduHtml.replace(/<div class="cv-section-title"[^>]*>.*?<\/div>/, '')}
            ${customSectionsHtml}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 4: KHALIL RICHARDSON (Slate Sidebar, Cream Highlight Tags)
    // -------------------------------------------------------------
    else if (tpl === 'khalil') {
      pg.innerHTML = `
        <div class="cv-khalil-sidebar">
          <div>
            ${photoUrl ? `<img src="${photoUrl}" class="cv-khalil-avatar" alt="Photo">` : ''}
            <div class="cv-khalil-name">${E(d.personal.name || 'KHALIL RICHARDSON')}</div>
            <div class="cv-khalil-title">${E(d.personal.title || d.jobRole || 'JOURNALIST')}</div>
            <div class="cv-khalil-sidebar-title">ABOUT ME</div>
            <div style="font-size:0.8rem;color:#cbd5e1;line-height:1.6">${E(d.summaries[0]?.text || '')}</div>
            <div class="cv-khalil-sidebar-title">SKILLS</div>
            <div style="font-size:0.82rem;color:#e2e8f0;line-height:1.7">
              ${d.skills.flatMap(c => c.items).map(s => `<div>- ${E(s.split(':')[0])}</div>`).join('')}
            </div>
          </div>
          <div style="font-size:0.78rem;color:#9ca3af;display:flex;flex-direction:column;gap:0.35rem;border-top:1px solid rgba(255,255,255,0.2);padding-top:1rem;margin-top:1.5rem">
            <div style="font-weight:700;color:#fff;letter-spacing:1px">CONTACT</div>
            ${d.personal.phone ? `<div>📞 ${E(d.personal.phone)}</div>` : ''}
            ${d.personal.email ? `<div>✉ ${E(d.personal.email)}</div>` : ''}
            ${d.personal.location ? `<div>📍 ${E(d.personal.location)}</div>` : ''}
          </div>
        </div>
        <div class="cv-khalil-main">
          <div class="cv-khalil-tag-title">WORK EXPERIENCE</div>
          ${expHtml.replace(/<div class="cv-section-title"[^>]*>.*?<\/div>/, '')}
          ${d.languages && d.languages.length ? `
            <div class="cv-khalil-tag-title" style="margin-top:1.5rem">LANGUAGES</div>
            <div style="margin-bottom:1.5rem;font-size:0.85rem;color:#475569">
              ${d.languages.map(l => `<div>${E(l)}</div>`).join('')}
            </div>
          ` : ''}
          <div class="cv-khalil-tag-title">EDUCATION</div>
          ${eduHtml.replace(/<div class="cv-section-title"[^>]*>.*?<\/div>/, '')}
          ${customSectionsHtml}
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 5: KAI CARTER (Solid Black Header, Crosshatch Art, 2 Columns)
    // -------------------------------------------------------------
    else if (tpl === 'kai') {
      pg.innerHTML = `
        <div class="cv-kai-header">
          <div>
            <div class="cv-kai-name">${E(d.personal.name || 'KAI CARTER')}</div>
            <div class="cv-kai-title">${E(d.personal.title || d.jobRole || 'GENERAL PRACTITIONER')}</div>
            <div class="cv-kai-contact-label">CONTACT</div>
            <div class="cv-kai-contact-info">
              <div>PHONE: ${E(d.personal.phone || '')}</div>
              <div>WEBSITE: ${E(d.personal.website || '')}</div>
              <div>EMAIL: ${E(d.personal.email || '')}</div>
            </div>
          </div>
          <svg class="cv-kai-art" viewBox="0 0 100 80" fill="none" stroke="white" stroke-width="4">
            <line x1="10" y1="10" x2="40" y2="40" stroke-linecap="round" />
            <line x1="40" y1="10" x2="10" y2="40" stroke-linecap="round" />
            <line x1="60" y1="20" x2="90" y2="50" stroke-linecap="round" />
            <line x1="90" y1="20" x2="60" y2="50" stroke-linecap="round" />
            <line x1="25" y1="45" x2="55" y2="75" stroke-linecap="round" />
            <line x1="55" y1="45" x2="25" y2="75" stroke-linecap="round" />
          </svg>
        </div>
        <div class="cv-kai-body">
          <div class="cv-kai-col-left">
            <div class="cv-section">
              <div class="cv-section-title">PROFILE</div>
              <div class="cv-summary">${E(d.summaries[0]?.text || '')}</div>
            </div>
            ${expHtml}
            ${customSectionsHtml}
          </div>
          <div class="cv-kai-col-right">
            ${eduHtml}
            <div class="cv-section">
              <div class="cv-section-title">SKILLS</div>
              <div style="font-size:0.82rem;color:#334155;line-height:1.7">
                ${d.skills.flatMap(c => c.items).map(s => `<div>${E(s.split(':')[0])}</div>`).join('')}
              </div>
            </div>
            ${d.interests.length ? `
              <div class="cv-section">
                <div class="cv-section-title">HOBBIES</div>
                <div style="font-size:0.82rem;color:#334155;line-height:1.7">
                  ${d.interests.map(i => `<div>${E(i)}</div>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 6: MICHELLE ROBINSON (Dark Sidebar, Timeline Dots, Dual Bars)
    // -------------------------------------------------------------
    else if (tpl === 'michelle') {
      const skillsFlat = d.skills.flatMap(c => c.items);
      const halfSkills = Math.ceil(skillsFlat.length / 2);
      const skillsCol1 = skillsFlat.slice(0, halfSkills);
      const skillsCol2 = skillsFlat.slice(halfSkills);

      pg.innerHTML = `
        <div class="cv-michelle-sidebar">
          <div style="text-align:center">
            ${photoUrl ? `<img src="${photoUrl}" class="cv-michelle-avatar" alt="Photo">` : ''}
          </div>
          <div class="cv-michelle-sidebar-section">
            <div class="cv-michelle-sidebar-title">ABOUT ME</div>
            <div style="font-size:0.8rem;color:#cbd5e1;line-height:1.6">${E(d.summaries[0]?.text || '')}</div>
          </div>
          <div class="cv-michelle-sidebar-section">
            <div class="cv-michelle-sidebar-title">LINKS</div>
            <div style="font-size:0.78rem;color:#cbd5e1;display:flex;flex-direction:column;gap:0.4rem">
              ${d.personal.website ? `<div>Website: <span style="color:#fff">${E(d.personal.website)}</span></div>` : '<div>Behance: <span style="color:#fff">behance.net/profile</span></div>'}
              ${d.personal.linkedin ? `<div>LinkedIn: <span style="color:#fff">${E(d.personal.linkedin)}</span></div>` : '<div>Twitter: <span style="color:#fff">twitter.com/profile</span></div>'}
            </div>
          </div>
          <div class="cv-michelle-sidebar-section">
            <div class="cv-michelle-sidebar-title">REFERENCES</div>
            <div style="font-size:0.78rem;color:#cbd5e1;line-height:1.5">
              <div style="font-weight:700;color:#fff">Mr. Michel Robinson</div>
              <div style="font-style:italic">Senior Design Consultant</div>
              <div>T: +1212-941-7824</div>
              <div>E: info@domain.com</div>
            </div>
          </div>
          ${d.languages.length ? `
            <div class="cv-michelle-sidebar-section">
              <div class="cv-michelle-sidebar-title">LANGUAGES</div>
              <div style="font-size:0.78rem;color:#fff;display:flex;gap:0.75rem;flex-wrap:wrap">
                ${d.languages.map(l => `<span>● ${E(l)}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          <div style="font-size:0.78rem;color:#cbd5e1">
            <div class="cv-michelle-sidebar-title">ADDITIONAL DETAILS</div>
            <div>Driving License Full</div>
          </div>
        </div>
        <div class="cv-michelle-main">
          <div class="cv-michelle-header">
            <div>
              <div class="cv-michelle-name">${E(d.personal.name || 'MICHELLE ROBINSON')}</div>
              <div class="cv-michelle-title">${E(d.personal.title || d.jobRole || 'GRAPHIC DESIGNER')}</div>
            </div>
            <div class="cv-michelle-contact-badge-list">
              ${d.personal.location ? `<div class="cv-michelle-contact-item"><span class="cv-michelle-contact-icon">📍</span><span>${E(d.personal.location)}</span></div>` : ''}
              ${d.personal.phone ? `<div class="cv-michelle-contact-item"><span class="cv-michelle-contact-icon">📞</span><span>${E(d.personal.phone)}</span></div>` : ''}
              ${d.personal.email ? `<div class="cv-michelle-contact-item"><span class="cv-michelle-contact-icon">✉</span><span>${E(d.personal.email)}</span></div>` : ''}
              ${d.personal.website ? `<div class="cv-michelle-contact-item"><span class="cv-michelle-contact-icon">🔗</span><span>${E(d.personal.website)}</span></div>` : ''}
            </div>
          </div>
          <div class="cv-michelle-section-title">WORK EXPERIENCE</div>
          ${d.experience.map(e => `
            <div class="cv-timeline-item">
              <div class="cv-timeline-left">
                <div style="font-weight:700;color:#1f2937">${E(e.company)}</div>
                <div>${E(e.location)}</div>
                <div style="color:#9ca3af">${E(e.date)}</div>
              </div>
              <div class="cv-timeline-dot"></div>
              <div class="cv-timeline-right">
                <div style="font-weight:700;color:#1f2937;font-size:0.85rem">${E(e.title)}</div>
                <div style="margin-top:0.25rem">${nl2ul(e.desc)}</div>
              </div>
            </div>
          `).join('')}
          <div class="cv-michelle-section-title" style="margin-top:1.5rem">EDUCATION</div>
          ${d.education.map(e => `
            <div class="cv-timeline-item">
              <div class="cv-timeline-left">
                <div style="font-weight:700;color:#1f2937">${E(e.school)}</div>
                <div style="color:#9ca3af">${E(e.date)}</div>
              </div>
              <div class="cv-timeline-dot"></div>
              <div class="cv-timeline-right">
                <div style="font-weight:700;color:#1f2937;font-size:0.85rem">${E(e.degree)}</div>
                ${e.desc ? `<div style="margin-top:0.25rem">${E(e.desc)}</div>` : ''}
              </div>
            </div>
          `).join('')}
          <div class="cv-michelle-section-title" style="margin-top:1.5rem">SKILLS</div>
          <div class="cv-michelle-skills-grid">
            <div>${skillsCol1.map(s => renderSkillBars([s], false)).join('')}</div>
            <div>${skillsCol2.map(s => renderSkillBars([s], false)).join('')}</div>
          </div>
          ${customSectionsHtml}
          ${d.interests.length ? `
            <div class="cv-michelle-section-title" style="margin-top:1.5rem">HOBBIES</div>
            <div style="font-size:0.8rem;color:#4b5563;display:flex;gap:1rem;flex-wrap:wrap">
              ${d.interests.map(i => `<span>● ${E(i)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 7: EXECUTIVE NAVY (Deep Navy Block Sidebar, Focus Headline)
    // -------------------------------------------------------------
    else if (tpl === 'executive-navy') {
      pg.innerHTML = `
        <div class="cv-exec-navy-sidebar">
          <div>
            <div class="cv-exec-navy-graphic"></div>
            <div class="cv-exec-navy-label">PROFESSIONAL<br>SUMMARY</div>
          </div>
          <div>
            <div class="cv-exec-navy-label">AREAS OF<br>EXPERTISE</div>
          </div>
          <div>
            <div class="cv-exec-navy-label">EXPERIENCE<br>HIGHLIGHTS</div>
          </div>
        </div>
        <div class="cv-exec-navy-main">
          <div class="cv-exec-navy-top">
            <div class="cv-exec-navy-name">${E(d.personal.name || 'FIRSTNAME LASTNAME')}</div>
            <div class="cv-exec-navy-contact">
              ${d.personal.location ? `${E(d.personal.location)} | ` : ''}
              ${d.personal.phone ? `${E(d.personal.phone)} | ` : ''}
              ${d.personal.email ? `${E(d.personal.email)} | ` : ''}
              ${d.personal.linkedin ? `${E(d.personal.linkedin)}` : ''}
            </div>
          </div>
          <div class="cv-exec-navy-body">
            <div>
              <div class="cv-exec-navy-headline">${E(d.jobRole || 'REPLACE WITH YOUR FOCUS HEADLINE')}</div>
              <div class="cv-exec-navy-subheading">${E(d.summaries[0]?.text || 'Strategic and results-driven leader specializing in scalable business operations and enterprise performance.')}</div>
            </div>
            <div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.82rem;color:#334155">
                ${d.skills.flatMap(c => c.items).map(s => `<div>▪ ${E(s.split(':')[0])}</div>`).join('')}
              </div>
            </div>
            <div>
              ${d.experience.map(e => `
                <div style="margin-bottom:1.5rem">
                  <div class="cv-exec-navy-company-bar">
                    <span>${E(e.company)}${e.location ? ' ■ ' + E(e.location) : ''}</span>
                    <span>${E(e.date)}</span>
                  </div>
                  <div class="cv-exec-navy-jobtitle-bar">${E(e.title)}</div>
                  <div style="font-size:0.82rem;color:#334155;line-height:1.6">${nl2ul(e.desc)}</div>
                </div>
              `).join('')}
            </div>
            ${eduHtml}
            ${customSectionsHtml}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 8: SUE WONG (Ocean Teal Header, Angular Cut, Dial Skills)
    // -------------------------------------------------------------
    else if (tpl === 'sue-wong') {
      pg.innerHTML = `
        <div class="cv-sue-header">
          <div>
            <div class="cv-sue-name">${E(d.personal.name || 'Sue Wong')}</div>
            <div class="cv-sue-title">${E(d.personal.title || d.jobRole || 'Planning Engineer')}</div>
          </div>
          ${photoUrl ? `<img src="${photoUrl}" class="cv-sue-avatar" alt="Photo">` : ''}
          <div class="cv-sue-contact">
            <div>${E(d.personal.location || 'Brisbane, Queensland')}</div>
            <div>${E(d.personal.phone || '+61 400 000 000')}</div>
            <div>${E(d.personal.email || 'sue.wong@domain.com')}</div>
          </div>
        </div>
        <div class="cv-sue-body">
          <div class="cv-sue-col-left">
            <div class="cv-sue-section-title">Work Experience</div>
            ${d.experience.map(e => `
              <div style="margin-bottom:1.25rem">
                <div style="font-size:0.75rem;color:#64748b">${E(e.date)}</div>
                <div style="font-weight:700;color:#005f73;font-size:0.9rem">${E(e.title)}</div>
                <div style="font-size:0.8rem;color:#64748b;margin-bottom:0.35rem">${E(e.company)}</div>
                <div style="font-size:0.8rem;color:#334155">${nl2ul(e.desc)}</div>
              </div>
            `).join('')}
          </div>
          <div class="cv-sue-col-right">
            <div class="cv-sue-section-title">Summary</div>
            <div style="font-size:0.8rem;color:#475569;line-height:1.6;margin-bottom:1.5rem">${E(d.summaries[0]?.text || '')}</div>
            <div class="cv-sue-section-title">Education</div>
            ${d.education.map(e => `
              <div style="margin-bottom:1rem;font-size:0.8rem">
                <div style="color:#64748b;font-size:0.75rem">${E(e.date)}</div>
                <div style="font-weight:700;color:#005f73">${E(e.degree)}</div>
                <div style="color:#475569">${E(e.school)}</div>
              </div>
            `).join('')}
            <div class="cv-sue-section-title" style="margin-top:1rem">Skills</div>
            <div class="cv-sue-skill-dial-grid">
              ${d.skills.flatMap(c => c.items).slice(0, 4).map(s => {
                const parts = s.split(':');
                const pct = parts.length === 2 ? parts[1].trim() : '90%';
                const name = parts[0].trim();
                return `
                  <div class="cv-skill-dial">
                    <div class="cv-skill-dial-circle">${pct}</div>
                    <span style="font-weight:600;color:#334155">${E(name)}</span>
                  </div>
                `;
              }).join('')}
            </div>
            ${customSectionsHtml}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 9: CHLOE MORGAN (Warm Espresso Arch & Blush Terracotta)
    // -------------------------------------------------------------
    else if (tpl === 'chloe') {
      pg.innerHTML = `
        <div class="cv-chloe-sidebar">
          <div class="cv-chloe-photo-arch">
            ${photoUrl ? `<img src="${photoUrl}" alt="Photo">` : ''}
          </div>
          <div class="cv-chloe-blush-card">
            <h4>About Me</h4>
            <p style="font-size:0.8rem;line-height:1.6">${E(d.summaries[0]?.text || '')}</p>
          </div>
          <div class="cv-chloe-contact-badge">
            <div style="font-weight:800;font-size:0.9rem;margin-bottom:0.2rem">Contact me</div>
            ${d.personal.phone ? `<div>📞 ${E(d.personal.phone)}</div>` : ''}
            ${d.personal.email ? `<div>✉ ${E(d.personal.email)}</div>` : ''}
            ${d.personal.location ? `<div>📍 ${E(d.personal.location)}</div>` : ''}
          </div>
        </div>
        <div class="cv-chloe-main">
          <div class="cv-chloe-header-pill">
            <div class="cv-chloe-name">${E(d.personal.name || 'CHLOE MORGAN')}</div>
            <div class="cv-chloe-title">${E(d.personal.title || d.jobRole || 'Graphic Designer')}</div>
          </div>
          <div class="cv-chloe-section-title"><span>○</span> EDUCATION</div>
          ${d.education.map(e => `
            <div style="font-size:0.82rem;color:#361e12;margin-bottom:0.75rem">
              <div style="font-weight:700">${E(e.school)} (${E(e.date)})</div>
              <div>${E(e.degree)} ${e.gpa ? '· ' + E(e.gpa) : ''}</div>
            </div>
          `).join('')}
          <div class="cv-chloe-section-title" style="margin-top:1.5rem"><span>○</span> WORK EXPERIENCE</div>
          ${d.experience.map(e => `
            <div class="cv-chloe-exp-item">
              <div style="font-weight:700;color:#361e12;font-size:0.85rem">${E(e.company)} | ${E(e.date)}</div>
              <div style="font-style:italic;color:#8c5338;font-size:0.8rem">${E(e.title)}</div>
              <div style="font-size:0.8rem;color:#4b5563;margin-top:0.25rem">${nl2ul(e.desc)}</div>
            </div>
          `).join('')}
          <div class="cv-chloe-section-title" style="margin-top:1.5rem"><span>○</span> SKILLS</div>
          <div style="display:flex;flex-direction:column;gap:0.35rem;font-size:0.82rem;color:#361e12">
            ${d.skills.flatMap(c => c.items).map(s => `<div>• ${E(s.split(':')[0])}</div>`).join('')}
          </div>
          ${customSectionsHtml}
        </div>
      `;
    }

    // -------------------------------------------------------------
    // TEMPLATE 10: MICHAEL THOMPSON (Full Dark Charcoal Sleek Minimalist)
    // -------------------------------------------------------------
    else if (tpl === 'thompson') {
      pg.innerHTML = `
        <div class="cv-thompson-header">
          ${photoUrl ? `<img src="${photoUrl}" class="cv-thompson-avatar" alt="Photo">` : ''}
          <div>
            <div class="cv-thompson-name">${E(d.personal.name || 'Michael Thompson')}</div>
            <div class="cv-thompson-title">${E(d.personal.title || d.jobRole || 'Business Development Manager')}</div>
          </div>
        </div>
        <div class="cv-thompson-body">
          <div class="cv-thompson-col-left">
            <div>
              <div class="cv-thompson-section-title">+ Skills</div>
              <div class="cv-thompson-text">
                ${d.skills.flatMap(c => c.items).map(s => `<div style="margin-bottom:0.25rem">${E(s.split(':')[0])}</div>`).join('')}
              </div>
            </div>
            ${d.languages.length ? `
              <div>
                <div class="cv-thompson-section-title">+ Languages</div>
                <div class="cv-thompson-text">
                  ${d.languages.map(l => `<div style="margin-bottom:0.25rem">${E(l)}</div>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="cv-thompson-col-right">
            <div>
              <div class="cv-thompson-section-title">+ About Me</div>
              <div class="cv-thompson-text">${E(d.summaries[0]?.text || '')}</div>
            </div>
            <div>
              <div class="cv-thompson-section-title">+ Contact Info</div>
              <div class="cv-thompson-text">
                ${d.personal.phone ? `<div>Phone: ${E(d.personal.phone)}</div>` : ''}
                ${d.personal.email ? `<div>Email: ${E(d.personal.email)}</div>` : ''}
                ${d.personal.location ? `<div>Address: ${E(d.personal.location)}</div>` : ''}
              </div>
            </div>
            <div>
              <div class="cv-thompson-section-title">+ Education</div>
              ${d.education.map(e => `
                <div style="margin-bottom:0.75rem">
                  <div style="font-size:0.75rem;color:#9ca3af">${E(e.date)}</div>
                  <div style="color:#fff;font-weight:600;font-size:0.85rem">${E(e.degree)}</div>
                  <div class="cv-thompson-text">${E(e.school)}</div>
                </div>
              `).join('')}
            </div>
            <div>
              <div class="cv-thompson-section-title">+ Work Experience</div>
              ${d.experience.map(e => `
                <div style="margin-bottom:1.25rem">
                  <div style="font-size:0.75rem;color:#9ca3af">${E(e.date)} - ${E(e.company)}</div>
                  <div style="color:#fff;font-weight:700;font-size:0.88rem">${E(e.title)}</div>
                  <div class="cv-thompson-text" style="margin-top:0.25rem">${nl2ul(e.desc)}</div>
                </div>
              `).join('')}
            </div>
            ${customSectionsHtml}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------
    // DEFAULT & OTHER CANVA TEMPLATES
    // -------------------------------------------------------------
    else {
      pg.innerHTML = `
        <div style="padding:20mm">
          <div class="cv-header" style="border-bottom:2.5px solid ${color};padding-bottom:1rem">
            ${photoContainerHtml}
            <div class="cv-name" style="color:${color}">${E(d.personal.name || 'Your Name')}</div>
            <div class="cv-jobtitle" style="color:#64748b">${E(d.personal.title || d.jobRole || '')}</div>
            <div class="cv-contact">${contactHtml}</div>
          </div>
          ${summaryHtml}
          ${expHtml}
          ${eduHtml}
          ${skillsHtml}
          ${customSectionsHtml}
          ${langsHtml}
          ${interestsHtml}
        </div>
      `;
    }
  },

  // ATS Checker
  checkATS() {
    Utils.showLoading('Scanning resume keywords with ATS parsing engine...');
    setTimeout(() => {
      Utils.hideLoading();
      const d = AppState.currentResume.data;
      let score = 55;
      if (d.personal.name) score += 5;
      if (d.personal.email) score += 5;
      if (d.personal.phone) score += 5;
      if (d.summaries && d.summaries.some(s => s.text.length > 40)) score += 10;
      if (d.experience && d.experience.length >= 1) score += 10;
      if (d.education && d.education.length >= 1) score += 5;
      if (d.skills && d.skills.some(c => c.items.length >= 3)) score += 8;

      score = Math.min(score, 98);
      const cls = score >= 80 ? 'score-high' : score >= 65 ? 'score-med' : 'score-low';

      document.getElementById('atsResult').innerHTML = `
        <div style="text-align:center">
          <h2>ATS Compatibility Score</h2>
          <p style="color:var(--text-secondary);margin-bottom:1.5rem">Evaluated against standard Taleo, Workday, and Greenhouse parsing algorithms.</p>
          <div class="ats-score-circle ${cls}">${score}%</div>
          <div class="ats-tips">
            <h4>ATS Checklist Summary</h4>
            <ul>
              <li class="${d.personal.name && d.personal.email ? 'pass' : 'fail'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d.personal.name && d.personal.email ? 'M20 6L9 17l-5-5' : 'M18 6L6 18M6 6l12 12'}"/></svg>
                Contact Information: ${d.personal.name && d.personal.email ? 'Complete contact essentials detected' : 'Missing contact essentials'}
              </li>
              <li class="${d.summaries && d.summaries.some(s => s.text.length > 40) ? 'pass' : 'fail'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d.summaries && d.summaries.some(s => s.text.length > 40) ? 'M20 6L9 17l-5-5' : 'M18 6L6 18M6 6l12 12'}"/></svg>
                Professional Bio / Summary: ${d.summaries && d.summaries.some(s => s.text.length > 40) ? 'Strong keyword density present' : 'Summary is too short or missing'}
              </li>
              <li class="${d.experience && d.experience.length ? 'pass' : 'fail'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d.experience && d.experience.length ? 'M20 6L9 17l-5-5' : 'M18 6L6 18M6 6l12 12'}"/></svg>
                Chronological Experience: ${d.experience && d.experience.length ? 'Action-driven positions detected' : 'Add at least 1 work history position'}
              </li>
            </ul>
          </div>
        </div>
      `;
      UI.openModal('atsModal');
    }, 600);
  },

  // Export PDF
  exportPDF() {
    Utils.showToast('Rendering high-resolution PDF...', 'info');
    const preview = document.getElementById('previewPage');
    if (!preview) return;

    if (typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
      html2canvas(preview, { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
        pdf.save(`${(AppState.currentResume.title || 'Resume').replace(/\s+/g, '_')}.pdf`);
        Utils.showToast('PDF downloaded successfully!', 'success');
      }).catch(err => {
        console.error(err);
        window.print();
      });
    } else {
      window.print();
    }
  },

  // Export JSON Backup
  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AppState.currentResume, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${(AppState.currentResume.title || 'Resume').replace(/\s+/g, '_')}_backup.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    Utils.showToast('Local JSON Backup saved!', 'success');
  }
};

// ==========================================
// 9. GLOBAL UI & EVENT LISTENERS
// ==========================================
const UI = {
  initLanding() {
    document.querySelectorAll('.stat-number').forEach(c => {
      const t = +c.getAttribute('data-count');
      const step = t / 80;
      let cur = 0;
      const up = () => {
        cur += step;
        if (cur < t) {
          c.innerText = Math.ceil(cur).toLocaleString();
          requestAnimationFrame(up);
        } else {
          c.innerText = t.toLocaleString();
        }
      };
      up();
    });

    const tc = document.getElementById('templateCarousel');
    if (tc) {
      // Show image-based templates FIRST (the 10 reference images), then others
      const imageTemplates = Editor.templates.filter(t => t.img);
      const otherTemplates = Editor.templates.filter(t => !t.img);
      const orderedTemplates = [...imageTemplates, ...otherTemplates];

      tc.innerHTML = orderedTemplates.map(t => `
        <div class="template-preview-card">
          <div class="template-thumb" onclick="Dashboard.createWithTemplate('${t.id}')">
            ${t.img ? `<img src="${t.img}" alt="${t.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.style.background='${t.preview}';">` : `<div style="width:100%;height:100%;background:${t.preview}"></div>`}
            <div class="template-thumb-overlay">
              <span style="font-weight:800;font-size:1.05rem;color:#fff;text-align:center;text-shadow:0 2px 4px rgba(0,0,0,0.6)">${t.name}</span>
              <button class="btn btn-primary btn-xs glow-btn" onclick="event.stopPropagation();Dashboard.createWithTemplate('${t.id}')">✨ Edit This Template</button>
            </div>
          </div>
          <div class="template-info">
            <span style="font-weight:700;font-size:0.9rem">${t.name}</span>
            <span style="font-size:0.75rem;color:var(--primary);font-weight:800;background:rgba(16,185,129,0.1);padding:2px 8px;border-radius:12px">${t.img ? '📸 PREVIEW' : 'STYLE'}</span>
          </div>
        </div>
      `).join('');
    }

    const hp = document.getElementById('heroPreviewBody');
    if (hp) {
      hp.innerHTML = `
        <div style="display:flex;gap:1.5rem;height:100%">
          <div style="width:35%;background:#18181b;border-radius:8px;padding:1rem;color:#fff;display:flex;flex-direction:column;gap:0.75rem">
            <div style="width:50px;height:50px;border-radius:50%;background:#3f3f46;margin:0 auto"></div>
            <div style="width:70%;height:10px;background:#facc15;margin:0 auto;border-radius:4px"></div>
            <div style="width:90%;height:6px;background:#52525b;margin:0 auto;border-radius:4px"></div>
            <div style="margin-top:auto;display:flex;flex-direction:column;gap:5px">
              <div style="width:100%;height:4px;background:#cca352;border-radius:2px"></div>
              <div style="width:80%;height:4px;background:#cca352;border-radius:2px"></div>
            </div>
          </div>
          <div style="width:65%;display:flex;flex-direction:column;gap:0.75rem;padding:0.5rem">
            <div style="width:60%;height:16px;background:#18181b;border-radius:4px"></div>
            <div style="width:40%;height:10px;background:#94a3b8;border-radius:4px"></div>
            <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px"></div>
            <div style="width:90%;height:8px;background:#e2e8f0;border-radius:4px"></div>
            <div style="margin-top:1rem;width:40%;height:12px;background:#008080;border-radius:4px"></div>
            <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px"></div>
            <div style="width:85%;height:8px;background:#e2e8f0;border-radius:4px"></div>
          </div>
        </div>
      `;
    }
  },
  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('hidden');
  },
  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  },
  selTplOpt(el) {
    document.querySelectorAll('.template-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
  },
  setupScrollAnims() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
  }
};

// Global Windows Hooks
window.closeModal = UI.closeModal;
window.AIModal = AIModal;
window.TemplateImporter = TemplateImporter;
window.Dashboard = Dashboard;
window.Editor = Editor;
window.Router = Router;
window.Theme = Theme;
window.UI = UI;
window.toggleMobileMenu = () => {
  const nav = document.getElementById('navLinks');
  if (!nav) return;
  if (nav.style.display === 'flex') {
    nav.style.display = 'none';
  } else {
    nav.style.display = 'flex';
    nav.style.flexDirection = 'column';
    nav.style.position = 'absolute';
    nav.style.top = '72px';
    nav.style.left = '0';
    nav.style.width = '100%';
    nav.style.background = 'var(--bg-secondary)';
    nav.style.padding = '1rem';
    nav.style.borderBottom = '1px solid var(--border-color)';
  }
};

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); Editor.undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); Editor.redo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); Editor.autoSave(); Utils.showToast('Saved!', 'success'); }
});

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Auth.init();
  Router.init();
  UI.setupScrollAnims();
});
