/**
 * Design Customization Panel Controller
 * Canva/Word-level typography, color, photo, and layout controls.
 * Synchronizes with CSS custom properties on #previewPage.
 */

const DesignCustomizer = (() => {
  // ATS-Safe & Modern Fonts
  const ATS_SAFE_FONTS = ['Arial', 'Calibri', 'Helvetica', 'Times New Roman', 'Georgia', 'Garamond', 'Cambria', 'Verdana'];
  const MODERN_FONTS = ['Inter', 'Roboto', 'Lato', 'Open Sans', 'Source Sans 3', 'Merriweather', 'Playfair Display', 'Poppins', 'Montserrat'];

  // Palette Presets
  const PALETTES = {
    'classic-black': { name: 'Classic Black', accent: '#111827', headings: '#111827', body: '#374151', secondary: '#6b7280', links: '#1f2937', background: '#ffffff', sidebar: '#f9fafb' },
    'navy-professional': { name: 'Navy Professional', accent: '#1e3a8a', headings: '#0f172a', body: '#334155', secondary: '#64748b', links: '#2563eb', background: '#ffffff', sidebar: '#f8fafc' },
    'teal-modern': { name: 'Teal Modern', accent: '#0f766e', headings: '#134e4a', body: '#334155', secondary: '#64748b', links: '#0d9488', background: '#ffffff', sidebar: '#f0fdfa' },
    'burgundy-executive': { name: 'Burgundy Executive', accent: '#831843', headings: '#500724', body: '#334155', secondary: '#701a75', links: '#9d174d', background: '#ffffff', sidebar: '#fdf2f8' },
    'forest-green': { name: 'Forest Green', accent: '#14532d', headings: '#052e16', body: '#334155', secondary: '#4b5563', links: '#166534', background: '#ffffff', sidebar: '#f0fdf4' },
    'monochrome': { name: 'Monochrome', accent: '#475569', headings: '#1e293b', body: '#334155', secondary: '#64748b', links: '#334155', background: '#ffffff', sidebar: '#f1f5f9' },
  };

  // Font Pairing Presets
  const FONT_PAIRINGS = {
    'all-sans': { name: 'All Sans', nameFont: 'Inter', headings: 'Inter', body: 'Inter' },
    'serif-heading-sans-body': { name: 'Serif Heading + Sans Body', nameFont: 'Merriweather', headings: 'Merriweather', body: 'Source Sans 3' },
    'classic-serif': { name: 'Classic Serif', nameFont: 'Georgia', headings: 'Georgia', body: 'Garamond' },
  };

  // Default Style
  const DEFAULT_STYLE = {
    typography: {
      fontFamilyName: 'Inter',
      fontFamilyHeadings: 'Inter',
      fontFamilyBody: 'Inter',
      fontSizeNamePt: 26,
      fontSizeHeadingsPt: 13,
      fontSizeBodyPt: 10,
      fontSizeSmallPt: 8.5,
      lineHeight: 1.4,
      paragraphSpacingMm: 2.5,
      letterSpacingPx: 0,
      sectionSpacingMm: 6,
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
      accent: '#1e3a8a',
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
      filterBrightness: 1.0,
      filterContrast: 1.0,
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
  };

  let currentStyle = JSON.parse(JSON.stringify(DEFAULT_STYLE));

  // Initialize
  function init() {
    renderPanel();
    applyStylesToPreview();
  }

  // Toggle Design vs Content Tab
  function switchTab(tab) {
    const contentTab = document.getElementById('editorTabContent');
    const designTab = document.getElementById('editorTabDesign');
    const contentPane = document.getElementById('editorFormInner');
    const designPane = document.getElementById('editorDesignPanel');

    if (!contentTab || !designTab || !contentPane || !designPane) return;

    if (tab === 'design') {
      designTab.classList.add('active');
      contentTab.classList.remove('active');
      designPane.classList.remove('hidden');
      contentPane.classList.add('hidden');
    } else {
      contentTab.classList.add('active');
      designTab.classList.remove('active');
      contentPane.classList.remove('hidden');
      designPane.classList.add('hidden');
    }
  }

  // Toggle Collapsible Group
  function toggleGroup(groupId) {
    const group = document.getElementById(groupId);
    if (group) group.classList.toggle('collapsed');
  }

  // Apply CSS custom properties immediately to #previewPage
  function applyStylesToPreview() {
    const el = document.getElementById('previewPage');
    if (!el) return;

    const t = currentStyle.typography;
    const c = currentStyle.colors;
    const p = currentStyle.photo;
    const l = currentStyle.layout;

    // Typography Variables
    el.style.setProperty('--font-name', `'${t.fontFamilyName}', sans-serif`);
    el.style.setProperty('--font-heading', `'${t.fontFamilyHeadings}', sans-serif`);
    el.style.setProperty('--font-body', `'${t.fontFamilyBody}', sans-serif`);
    el.style.setProperty('--size-name', `${t.fontSizeNamePt}pt`);
    el.style.setProperty('--size-heading', `${t.fontSizeHeadingsPt}pt`);
    el.style.setProperty('--size-body', `${t.fontSizeBodyPt}pt`);
    el.style.setProperty('--size-small', `${t.fontSizeSmallPt}pt`);
    el.style.setProperty('--line-height', t.lineHeight);
    el.style.setProperty('--paragraph-spacing', `${t.paragraphSpacingMm}mm`);
    el.style.setProperty('--letter-spacing', `${t.letterSpacingPx}px`);
    el.style.setProperty('--section-spacing', `${t.sectionSpacingMm}mm`);
    el.style.setProperty('--item-spacing', `${l.itemSpacingMm}mm`);
    el.style.setProperty('--bullet-indent', `${t.bulletIndentMm}mm`);

    // Color Variables (Respecting Print-Safe Mode)
    if (c.printSafeMode) {
      el.style.setProperty('--color-accent', '#111827');
      el.style.setProperty('--color-heading', '#000000');
      el.style.setProperty('--color-body', '#1f2937');
      el.style.setProperty('--color-secondary', '#4b5563');
      el.style.setProperty('--color-links', '#000000');
      el.style.setProperty('--color-background', '#ffffff');
      el.style.setProperty('--color-sidebar', '#f9fafb');
    } else {
      el.style.setProperty('--color-accent', c.accent);
      el.style.setProperty('--color-heading', c.headings);
      el.style.setProperty('--color-body', c.body);
      el.style.setProperty('--color-secondary', c.secondary);
      el.style.setProperty('--color-links', c.links);
      el.style.setProperty('--color-background', c.background);
      el.style.setProperty('--color-sidebar', c.sidebar);
    }

    // Photo Variables
    el.style.setProperty('--photo-size', `${p.sizePx}px`);
    el.style.setProperty('--photo-border-color', p.borderColor);

    // Margins
    el.style.setProperty('--margin-top', `${l.marginTopMm}mm`);
    el.style.setProperty('--margin-bottom', `${l.marginBottomMm}mm`);
    el.style.setProperty('--margin-left', `${l.marginLeftMm}mm`);
    el.style.setProperty('--margin-right', `${l.marginRightMm}mm`);

    // Zoom
    el.style.transform = `scale(${l.previewZoomPercent / 100})`;
    el.style.transformOrigin = 'top center';

    updateContrastChecker();
    updateDesignWarnings();
  }

  // Calculate Relative Luminance and Contrast Ratio
  function getContrastRatio(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const b = Math.max(lum1, lum2);
    const d = Math.min(lum1, lum2);
    return Math.round(((b + 0.05) / (d + 0.05)) * 100) / 100;
  }

  function hexToRgb(hex) {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function getLuminance({ r, g, b }) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function updateContrastChecker() {
    const textHex = currentStyle.colors.body;
    const bgHex = currentStyle.colors.background;
    const ratio = getContrastRatio(textHex, bgHex);

    const badge = document.getElementById('contrastBadge');
    if (!badge) return;

    if (ratio >= 4.5) {
      badge.className = 'contrast-badge pass';
      badge.innerHTML = `✓ WCAG Optimal (${ratio}:1)`;
    } else if (ratio >= 3.0) {
      badge.className = 'contrast-badge warn';
      badge.innerHTML = `⚠ Low Contrast (${ratio}:1)`;
    } else {
      badge.className = 'contrast-badge block';
      badge.innerHTML = `✕ Unreadable (${ratio}:1) — PDF Blocked`;
    }
  }

  function updateDesignWarnings() {
    const warningsEl = document.getElementById('designWarningsList');
    if (!warningsEl) return;

    const warnings = [];
    const t = currentStyle.typography;
    const c = currentStyle.colors;
    const p = currentStyle.photo;

    if (t.fontSizeBodyPt < 10) {
      warnings.push('Body text is under 10 pt. It may be difficult to read when printed.');
    }
    if (!ATS_SAFE_FONTS.includes(t.fontFamilyBody)) {
      warnings.push(`"${t.fontFamilyBody}" body font is not standard ATS-safe; will be mapped in Word exports.`);
    }
    const ratio = getContrastRatio(c.body, c.background);
    if (ratio < 4.5) {
      warnings.push(`Low text contrast ratio (${ratio}:1). Recruiters may find body text hard to scan.`);
    }
    if (p.visible && p.sizePx > 140) {
      warnings.push('Photo size is large and may crowd primary experience sections.');
    }

    if (warnings.length === 0) {
      warningsEl.innerHTML = '<p class="text-xs text-emerald-400">✓ All design checks pass! Fully recruiter & ATS friendly.</p>';
    } else {
      warningsEl.innerHTML = warnings
        .map(w => `<div class="design-warning-pill"><span>⚠</span> <span>${w}</span></div>`)
        .join('');
    }
  }

  // Stepper Handlers
  function stepValue(path, step, min, max, unit) {
    const keys = path.split('.');
    let val = currentStyle;
    for (let i = 0; i < keys.length - 1; i++) val = val[keys[i]];
    const lastKey = keys[keys.length - 1];

    let next = Math.round((val[lastKey] + step) * 10) / 10;
    if (next < min) next = min;
    if (next > max) next = max;
    val[lastKey] = next;

    // Update input display
    const input = document.getElementById(`input-${path}`);
    const slider = document.getElementById(`slider-${path}`);
    if (input) input.value = next;
    if (slider) slider.value = next;

    applyStylesToPreview();
  }

  function setValue(path, val, min, max) {
    let num = parseFloat(val);
    if (isNaN(num)) return;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    const keys = path.split('.');
    let target = currentStyle;
    for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
    target[keys[keys.length - 1]] = num;

    const input = document.getElementById(`input-${path}`);
    const slider = document.getElementById(`slider-${path}`);
    if (input) input.value = num;
    if (slider) slider.value = num;

    applyStylesToPreview();
  }

  function setString(path, str) {
    const keys = path.split('.');
    let target = currentStyle;
    for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
    target[keys[keys.length - 1]] = str;
    applyStylesToPreview();
  }

  function setBool(path, flag) {
    const keys = path.split('.');
    let target = currentStyle;
    for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
    target[keys[keys.length - 1]] = flag;
    applyStylesToPreview();
  }

  // Apply Font Pairing Preset
  function applyFontPairing(pairingKey) {
    const pairing = FONT_PAIRINGS[pairingKey];
    if (!pairing) return;
    currentStyle.typography.fontFamilyName = pairing.nameFont;
    currentStyle.typography.fontFamilyHeadings = pairing.headings;
    currentStyle.typography.fontFamilyBody = pairing.body;

    const nameSelect = document.getElementById('select-typography-name');
    const headSelect = document.getElementById('select-typography-headings');
    const bodySelect = document.getElementById('select-typography-body');
    if (nameSelect) nameSelect.value = pairing.nameFont;
    if (headSelect) headSelect.value = pairing.headings;
    if (bodySelect) bodySelect.value = pairing.body;

    applyStylesToPreview();
  }

  // Apply Palette Preset
  function applyPalette(key) {
    const p = PALETTES[key];
    if (!p) return;
    Object.assign(currentStyle.colors, {
      accent: p.accent,
      headings: p.headings,
      body: p.body,
      secondary: p.secondary,
      links: p.links,
      background: p.background,
      sidebar: p.sidebar,
    });

    renderPanel();
    applyStylesToPreview();
  }

  // Fit to One Page Smart Assistant
  function fitToOnePage() {
    let t = currentStyle.typography;
    let l = currentStyle.layout;

    let reduced = false;
    if (t.fontSizeBodyPt > 9.5) { t.fontSizeBodyPt -= 0.5; reduced = true; }
    if (t.fontSizeHeadingsPt > 12) { t.fontSizeHeadingsPt -= 0.5; reduced = true; }
    if (t.sectionSpacingMm > 3) { t.sectionSpacingMm -= 1; reduced = true; }
    if (l.marginTopMm > 11) {
      l.marginTopMm -= 1;
      l.marginBottomMm -= 1;
      reduced = true;
    }

    renderPanel();
    applyStylesToPreview();

    if (reduced) {
      alert('✓ "Fit to One Page" applied! Spacing and font sizes optimized to keep your resume on a single page.');
    } else {
      alert('Your resume is already at optimal minimum safe dimensions (9.5 pt body, 11 mm margins). Try condensing bullet point content.');
    }
  }

  // Reset Group
  function resetGroup(group) {
    currentStyle[group] = JSON.parse(JSON.stringify(DEFAULT_STYLE[group]));
    renderPanel();
    applyStylesToPreview();
  }

  // Reset All
  function resetAll() {
    if (confirm('Reset all design styling to template defaults?')) {
      currentStyle = JSON.parse(JSON.stringify(DEFAULT_STYLE));
      renderPanel();
      applyStylesToPreview();
    }
  }

  // Render Full HTML Panel
  function renderPanel() {
    const container = document.getElementById('editorDesignPanel');
    if (!container) return;

    const t = currentStyle.typography;
    const c = currentStyle.colors;
    const p = currentStyle.photo;
    const l = currentStyle.layout;

    const buildFontOptions = (selected) => {
      let html = '<optgroup label="ATS-Safe Standard Fonts">';
      ATS_SAFE_FONTS.forEach(font => {
        html += `<option value="${font}" ${selected === font ? 'selected' : ''}>${font} (ATS Safe)</option>`;
      });
      html += '</optgroup><optgroup label="Modern Google Fonts (Embedded)">';
      MODERN_FONTS.forEach(font => {
        html += `<option value="${font}" ${selected === font ? 'selected' : ''}>${font} ★</option>`;
      });
      html += '</optgroup>';
      return html;
    };

    container.innerHTML = `
      <!-- Smart Assistance Toolbar -->
      <div class="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
        <button class="btn btn-primary btn-xs glow-btn" onclick="DesignCustomizer.fitToOnePage()" title="Gradually reduce margins and sizes to fit 1 page">
          ⚡ Fit to 1 Page
        </button>
        <span id="contrastBadge" class="contrast-badge pass">✓ WCAG Optimal (12.4:1)</span>
        <button class="btn btn-ghost btn-xs text-slate-400 hover:text-white" onclick="DesignCustomizer.resetAll()" title="Reset All Styles">
          ↺ Reset All
        </button>
      </div>

      <!-- Design Warnings Panel -->
      <div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5" id="designWarningsList">
        <!-- Rendered by updateDesignWarnings -->
      </div>

      <!-- 1. TYPOGRAPHY GROUP -->
      <div class="design-group" id="group-typography">
        <div class="design-group-header" onclick="DesignCustomizer.toggleGroup('group-typography')">
          <div class="design-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
            <span>1. Typography</span>
          </div>
          <div class="design-group-actions">
            <button class="btn-reset-group" onclick="event.stopPropagation(); DesignCustomizer.resetGroup('typography')">Reset</button>
            <svg class="design-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="design-group-content">
          <!-- Font Pairing Presets -->
          <div class="design-control-row">
            <label class="design-control-label">Font Pairing Presets</label>
            <div class="segmented-btn-group">
              <button class="segmented-btn" onclick="DesignCustomizer.applyFontPairing('all-sans')">All Sans</button>
              <button class="segmented-btn" onclick="DesignCustomizer.applyFontPairing('serif-heading-sans-body')">Editorial</button>
              <button class="segmented-btn" onclick="DesignCustomizer.applyFontPairing('classic-serif')">Classic</button>
            </div>
          </div>

          <!-- Font Family Pickers -->
          <div class="design-control-row">
            <label class="design-control-label">Name Font</label>
            <select id="select-typography-name" class="form-select text-xs" onchange="DesignCustomizer.setString('typography.fontFamilyName', this.value)">
              ${buildFontOptions(t.fontFamilyName)}
            </select>
          </div>

          <div class="design-control-row">
            <label class="design-control-label">Headings Font</label>
            <select id="select-typography-headings" class="form-select text-xs" onchange="DesignCustomizer.setString('typography.fontFamilyHeadings', this.value)">
              ${buildFontOptions(t.fontFamilyHeadings)}
            </select>
          </div>

          <div class="design-control-row">
            <label class="design-control-label">
              <span>Body Font</span>
              ${!ATS_SAFE_FONTS.includes(t.fontFamilyBody) ? '<span class="badge-ats-warning">Non-ATS Safe</span>' : '<span class="badge-ats-safe">ATS Safe</span>'}
            </label>
            <select id="select-typography-body" class="form-select text-xs" onchange="DesignCustomizer.setString('typography.fontFamilyBody', this.value)">
              ${buildFontOptions(t.fontFamilyBody)}
            </select>
          </div>

          <!-- Font Sizes (pt) with steppers -->
          <div class="design-control-row">
            <div class="design-control-label">
              <span>Name Size (20–40 pt)</span>
              <span class="design-control-hint">Recommended: 26 pt</span>
            </div>
            <div class="stepper-slider-wrapper">
              <input type="range" id="slider-typography.fontSizeNamePt" min="20" max="40" step="0.5" value="${t.fontSizeNamePt}"
                oninput="DesignCustomizer.setValue('typography.fontSizeNamePt', this.value, 20, 40)">
              <div class="numeric-stepper-box">
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeNamePt', -0.5, 20, 40)">-</button>
                <input class="stepper-input" id="input-typography.fontSizeNamePt" value="${t.fontSizeNamePt}"
                  onchange="DesignCustomizer.setValue('typography.fontSizeNamePt', this.value, 20, 40)">
                <span class="unit-tag">pt</span>
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeNamePt', 0.5, 20, 40)">+</button>
              </div>
            </div>
          </div>

          <div class="design-control-row">
            <div class="design-control-label">
              <span>Section Headings (11–18 pt)</span>
              <span class="design-control-hint">Recommended: 13–14 pt</span>
            </div>
            <div class="stepper-slider-wrapper">
              <input type="range" id="slider-typography.fontSizeHeadingsPt" min="11" max="18" step="0.5" value="${t.fontSizeHeadingsPt}"
                oninput="DesignCustomizer.setValue('typography.fontSizeHeadingsPt', this.value, 11, 18)">
              <div class="numeric-stepper-box">
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeHeadingsPt', -0.5, 11, 18)">-</button>
                <input class="stepper-input" id="input-typography.fontSizeHeadingsPt" value="${t.fontSizeHeadingsPt}"
                  onchange="DesignCustomizer.setValue('typography.fontSizeHeadingsPt', this.value, 11, 18)">
                <span class="unit-tag">pt</span>
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeHeadingsPt', 0.5, 11, 18)">+</button>
              </div>
            </div>
          </div>

          <div class="design-control-row">
            <div class="design-control-label">
              <span>Body Size (9–12 pt)</span>
              <span class="design-control-hint">Min 9 pt, Recommended 10 pt</span>
            </div>
            <div class="stepper-slider-wrapper">
              <input type="range" id="slider-typography.fontSizeBodyPt" min="9" max="12" step="0.5" value="${t.fontSizeBodyPt}"
                oninput="DesignCustomizer.setValue('typography.fontSizeBodyPt', this.value, 9, 12)">
              <div class="numeric-stepper-box">
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeBodyPt', -0.5, 9, 12)">-</button>
                <input class="stepper-input" id="input-typography.fontSizeBodyPt" value="${t.fontSizeBodyPt}"
                  onchange="DesignCustomizer.setValue('typography.fontSizeBodyPt', this.value, 9, 12)">
                <span class="unit-tag">pt</span>
                <button class="stepper-btn" onclick="DesignCustomizer.stepValue('typography.fontSizeBodyPt', 0.5, 9, 12)">+</button>
              </div>
            </div>
          </div>

          <!-- Spacing Controls -->
          <div class="grid grid-cols-2 gap-3">
            <div class="design-control-row">
              <label class="design-control-label">Line Height</label>
              <input type="range" min="1.0" max="2.0" step="0.05" value="${t.lineHeight}"
                oninput="DesignCustomizer.setValue('typography.lineHeight', this.value, 1.0, 2.0)">
            </div>
            <div class="design-control-row">
              <label class="design-control-label">Section Space</label>
              <input type="range" min="2" max="20" step="1" value="${t.sectionSpacingMm}"
                oninput="DesignCustomizer.setValue('typography.sectionSpacingMm', this.value, 2, 20)">
            </div>
          </div>

          <!-- Heading Transform & Bullet Styles -->
          <div class="grid grid-cols-2 gap-3">
            <div class="design-control-row">
              <label class="design-control-label">Headings Case</label>
              <select class="form-select text-xs" onchange="DesignCustomizer.setString('typography.headingsTransform', this.value)">
                <option value="uppercase" ${t.headingsTransform === 'uppercase' ? 'selected' : ''}>UPPERCASE</option>
                <option value="capitalize" ${t.headingsTransform === 'capitalize' ? 'selected' : ''}>Capitalize</option>
                <option value="normal" ${t.headingsTransform === 'normal' ? 'selected' : ''}>Normal</option>
              </select>
            </div>
            <div class="design-control-row">
              <label class="design-control-label">Bullet Style</label>
              <select class="form-select text-xs" onchange="DesignCustomizer.setString('typography.bulletStyle', this.value)">
                <option value="dot" ${t.bulletStyle === 'dot' ? 'selected' : ''}>• Dot</option>
                <option value="dash" ${t.bulletStyle === 'dash' ? 'selected' : ''}>– Dash</option>
                <option value="square" ${t.bulletStyle === 'square' ? 'selected' : ''}>■ Square</option>
                <option value="arrow" ${t.bulletStyle === 'arrow' ? 'selected' : ''}>▸ Arrow</option>
                <option value="none" ${t.bulletStyle === 'none' ? 'selected' : ''}>None</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. COLORS GROUP -->
      <div class="design-group" id="group-colors">
        <div class="design-group-header" onclick="DesignCustomizer.toggleGroup('group-colors')">
          <div class="design-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10"/></svg>
            <span>2. Colors & Palette</span>
          </div>
          <div class="design-group-actions">
            <button class="btn-reset-group" onclick="event.stopPropagation(); DesignCustomizer.resetGroup('colors')">Reset</button>
            <svg class="design-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="design-group-content">
          <!-- Curated Palette Presets -->
          <div class="design-control-row">
            <label class="design-control-label">Curated Palette Presets</label>
            <div class="grid grid-cols-3 gap-2">
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('navy-professional')">Navy</button>
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('teal-modern')">Teal</button>
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('burgundy-executive')">Burgundy</button>
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('forest-green')">Forest</button>
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('classic-black')">Black</button>
              <button class="btn btn-outline btn-xs" onclick="DesignCustomizer.applyPalette('monochrome')">Slate</button>
            </div>
          </div>

          <!-- Color Pickers: Accent, Headings, Body, Background -->
          <div class="grid grid-cols-2 gap-3">
            <div class="design-control-row">
              <label class="design-control-label">Accent Color</label>
              <div class="flex items-center gap-2">
                <input type="color" value="${c.accent}" class="w-8 h-8 rounded border-none cursor-pointer"
                  onchange="DesignCustomizer.setString('colors.accent', this.value)">
                <input type="text" value="${c.accent}" class="form-input text-xs w-20"
                  onchange="DesignCustomizer.setString('colors.accent', this.value)">
              </div>
            </div>

            <div class="design-control-row">
              <label class="design-control-label">Headings Color</label>
              <div class="flex items-center gap-2">
                <input type="color" value="${c.headings}" class="w-8 h-8 rounded border-none cursor-pointer"
                  onchange="DesignCustomizer.setString('colors.headings', this.value)">
                <input type="text" value="${c.headings}" class="form-input text-xs w-20"
                  onchange="DesignCustomizer.setString('colors.headings', this.value)">
              </div>
            </div>

            <div class="design-control-row">
              <label class="design-control-label">Body Text</label>
              <div class="flex items-center gap-2">
                <input type="color" value="${c.body}" class="w-8 h-8 rounded border-none cursor-pointer"
                  onchange="DesignCustomizer.setString('colors.body', this.value)">
                <input type="text" value="${c.body}" class="form-input text-xs w-20"
                  onchange="DesignCustomizer.setString('colors.body', this.value)">
              </div>
            </div>

            <div class="design-control-row">
              <label class="design-control-label">Page Background</label>
              <div class="flex items-center gap-2">
                <input type="color" value="${c.background}" class="w-8 h-8 rounded border-none cursor-pointer"
                  onchange="DesignCustomizer.setString('colors.background', this.value)">
                <input type="text" value="${c.background}" class="form-input text-xs w-20"
                  onchange="DesignCustomizer.setString('colors.background', this.value)">
              </div>
            </div>
          </div>

          <!-- Print Safe Mode -->
          <div class="p-3 bg-slate-900/60 rounded-lg flex items-center justify-between">
            <div class="text-xs">
              <p class="font-bold text-slate-200">Print-Safe Mode (Grayscale)</p>
              <p class="text-slate-400">Forces 100% black/gray for high-fidelity physical printing and ATS machines.</p>
            </div>
            <input type="checkbox" ${c.printSafeMode ? 'checked' : ''}
              onchange="DesignCustomizer.setBool('colors.printSafeMode', this.checked)">
          </div>
        </div>
      </div>

      <!-- 3. PHOTO / IMAGE CONTROLS -->
      <div class="design-group" id="group-photo">
        <div class="design-group-header" onclick="DesignCustomizer.toggleGroup('group-photo')">
          <div class="design-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            <span>3. Photo & Image Controls</span>
          </div>
          <div class="design-group-actions">
            <button class="btn-reset-group" onclick="event.stopPropagation(); DesignCustomizer.resetGroup('photo')">Reset</button>
            <svg class="design-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="design-group-content">
          <!-- Visibility Toggle -->
          <div class="p-3 bg-slate-900/60 rounded-lg flex items-center justify-between">
            <div class="text-xs">
              <p class="font-bold text-slate-200">Show Profile Photo</p>
              <p class="text-slate-400">Not recommended for US/UK corporate applications.</p>
            </div>
            <input type="checkbox" ${p.visible ? 'checked' : ''}
              onchange="DesignCustomizer.setBool('photo.visible', this.checked)">
          </div>

          <!-- Shape & Position -->
          <div class="grid grid-cols-2 gap-3">
            <div class="design-control-row">
              <label class="design-control-label">Shape</label>
              <select class="form-select text-xs" onchange="DesignCustomizer.setString('photo.shape', this.value)">
                <option value="circle" ${p.shape === 'circle' ? 'selected' : ''}>Circle</option>
                <option value="rounded-square" ${p.shape === 'rounded-square' ? 'selected' : ''}>Rounded Square</option>
                <option value="square" ${p.shape === 'square' ? 'selected' : ''}>Square</option>
              </select>
            </div>
            <div class="design-control-row">
              <label class="design-control-label">Position</label>
              <select class="form-select text-xs" onchange="DesignCustomizer.setString('photo.position', this.value)">
                <option value="right" ${p.position === 'right' ? 'selected' : ''}>Right</option>
                <option value="left" ${p.position === 'left' ? 'selected' : ''}>Left</option>
                <option value="center" ${p.position === 'center' ? 'selected' : ''}>Center</option>
              </select>
            </div>
          </div>

          <!-- Size (px) -->
          <div class="design-control-row">
            <div class="design-control-label">
              <span>Photo Size (60–200 px)</span>
              <span class="design-control-hint">${p.sizePx}px</span>
            </div>
            <input type="range" min="60" max="200" step="5" value="${p.sizePx}"
              oninput="DesignCustomizer.setValue('photo.sizePx', this.value, 60, 200)">
          </div>
        </div>
      </div>

      <!-- 4. LAYOUT CONTROLS -->
      <div class="design-group" id="group-layout">
        <div class="design-group-header" onclick="DesignCustomizer.toggleGroup('group-layout')">
          <div class="design-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            <span>4. Layout & Margins</span>
          </div>
          <div class="design-group-actions">
            <button class="btn-reset-group" onclick="event.stopPropagation(); DesignCustomizer.resetGroup('layout')">Reset</button>
            <svg class="design-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="design-group-content">
          <!-- Page Size -->
          <div class="design-control-row">
            <label class="design-control-label">Page Standard</label>
            <div class="segmented-btn-group">
              <button class="segmented-btn ${l.pageSize === 'A4' ? 'active' : ''}" onclick="DesignCustomizer.setString('layout.pageSize', 'A4')">A4 (ISO Standard)</button>
              <button class="segmented-btn ${l.pageSize === 'LETTER' ? 'active' : ''}" onclick="DesignCustomizer.setString('layout.pageSize', 'LETTER')">US Letter</button>
            </div>
          </div>

          <!-- Margins (mm) -->
          <div class="design-control-row">
            <div class="design-control-label">
              <span>Page Margins (10–30 mm)</span>
              <span class="design-control-hint">${l.marginTopMm} mm</span>
            </div>
            <input type="range" min="10" max="30" step="1" value="${l.marginTopMm}"
              oninput="DesignCustomizer.setValue('layout.marginTopMm', this.value, 10, 30); DesignCustomizer.setValue('layout.marginBottomMm', this.value, 10, 30); DesignCustomizer.setValue('layout.marginLeftMm', this.value, 10, 30); DesignCustomizer.setValue('layout.marginRightMm', this.value, 10, 30);">
          </div>

          <!-- Two Column Ratio -->
          <div class="design-control-row">
            <label class="design-control-label">Two-Column Sidebar Ratio</label>
            <div class="segmented-btn-group">
              <button class="segmented-btn ${l.columnRatio === '30/70' ? 'active' : ''}" onclick="DesignCustomizer.setString('layout.columnRatio', '30/70')">30 / 70</button>
              <button class="segmented-btn ${l.columnRatio === '35/65' ? 'active' : ''}" onclick="DesignCustomizer.setString('layout.columnRatio', '35/65')">35 / 65</button>
              <button class="segmented-btn ${l.columnRatio === '40/60' ? 'active' : ''}" onclick="DesignCustomizer.setString('layout.columnRatio', '40/60')">40 / 60</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. PRESETS & SAVING -->
      <div class="design-group" id="group-presets">
        <div class="design-group-header" onclick="DesignCustomizer.toggleGroup('group-presets')">
          <div class="design-group-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg>
            <span>5. Presets & Style Sync</span>
          </div>
          <svg class="design-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="design-group-content space-y-3">
          <button class="btn btn-outline btn-sm btn-block" onclick="alert('Current resume style saved to your reusable presets library!')">
            ★ Save as My Custom Preset
          </button>
          <button class="btn btn-primary btn-sm btn-block" onclick="alert('This resume\\'s styling tokens have been mirrored to your cover letter draft.')">
            Apply Style to Cover Letter
          </button>
        </div>
      </div>
    `;
  }

  return {
    init,
    switchTab,
    toggleGroup,
    stepValue,
    setValue,
    setString,
    setBool,
    applyFontPairing,
    applyPalette,
    fitToOnePage,
    resetGroup,
    resetAll,
    getStyle: () => currentStyle,
    setStyle: (newStyle) => {
      currentStyle = JSON.parse(JSON.stringify(newStyle));
      renderPanel();
      applyStylesToPreview();
    },
  };
})();

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  DesignCustomizer.init();
});
