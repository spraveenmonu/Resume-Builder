/**
 * ResumeCraft AI — Authentication & Database Module (Supabase Powered)
 * Handles Supabase Auth (Email/Password + Google OAuth),
 * Local/Demo session fallback, route guards,
 * and dual storage (Supabase PostgreSQL + localStorage) for Resumes & Cover Letters.
 */

const Auth = {
  currentUser: null,
  authSubscription: null,
  resumesSubscription: null,
  coverLettersSubscription: null,

  // ---- Initialize Auth State Listener ----
  async init() {
    // 1. Immediately hydrate local state so router guards and navbar initialize synchronously
    Auth._checkLocalFallback();

    const isCloud = window.isSupabaseConfigured && window.supabaseClient;

    if (isCloud) {
      try {
        // 2. Get initial session
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (session && session.user) {
          Auth._setUserFromSession(session.user);
          Auth.migrateLocalStorage(session.user.id);
          Database.listenToResumes(session.user.id);
          Database.listenToCoverLetters(session.user.id);
        }

        // 3. Listen for auth changes
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (session && session.user) {
            Auth._setUserFromSession(session.user);
            Database.listenToResumes(session.user.id);
            Database.listenToCoverLetters(session.user.id);

            const currentPage = location.hash.replace('#', '') || 'landing';
            if (currentPage === 'auth') {
              Router.navigate('dashboard');
            }
          } else if (event === 'SIGNED_OUT') {
            Auth._clearSession();
          }
        });

        Auth.authSubscription = subscription;
        return;
      } catch (e) {
        console.warn('Supabase Auth listener error, falling back to Local Mode:', e);
      }
    }
  },

  _setUserFromSession(user) {
    const customUser = {
      uid: user.id,
      email: user.email,
      displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
      isCloud: true
    };
    Auth.currentUser = customUser;
    localStorage.setItem('rc_auth_user', JSON.stringify(customUser));
    Auth.updateNavbar(customUser);
  },

  _checkLocalFallback() {
    const savedUser = localStorage.getItem('rc_auth_user');
    if (savedUser) {
      try {
        Auth.currentUser = JSON.parse(savedUser);
      } catch (err) {
        Auth.currentUser = null;
      }
    } else {
      Auth.currentUser = null;
    }

    Auth.updateNavbar(Auth.currentUser);

    if (Auth.currentUser) {
      Database.listenToResumes(Auth.currentUser.uid);
      Database.listenToCoverLetters(Auth.currentUser.uid);
      const currentPage = location.hash.replace('#', '') || 'landing';
      if (currentPage === 'auth') {
        Router.navigate('dashboard');
      }
    }
  },

  _clearSession() {
    AppState.resumes = [];
    AppState.coverLetters = [];
    AppState.currentResume = null;
    AppState.currentCoverLetter = null;
    localStorage.removeItem('rc_auth_user');
    Auth.currentUser = null;
    Auth.updateNavbar(null);

    const currentPage = location.hash.replace('#', '') || 'landing';
    if (currentPage === 'dashboard' || currentPage === 'editor' || currentPage === 'coverletter-editor') {
      Router.navigate('auth');
    }
  },

  // ---- 1-Click Quick Demo / Guest Login ----
  quickDemoLogin() {
    const demoUser = {
      uid: 'demo_user_local',
      email: 'alex.morgan@resumecraft.ai',
      displayName: 'Alex Morgan',
      photoURL: '',
      isDemo: true
    };
    Auth.currentUser = demoUser;
    localStorage.setItem('rc_auth_user', JSON.stringify(demoUser));
    Auth.updateNavbar(demoUser);

    Database.listenToResumes(demoUser.uid);
    Database.listenToCoverLetters(demoUser.uid);

    Utils.showToast('Welcome Alex! Signed in via Demo Mode.', 'success');
    Router.navigate('dashboard');
  },

  // ---- Email/Password Sign Up ----
  async signup(email, password, displayName) {
    const isCloud = window.isSupabaseConfigured && window.supabaseClient;
    try {
      Auth.showAuthLoading('Creating your account...');

      if (isCloud) {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: displayName || email.split('@')[0]
            }
          }
        });

        if (error) throw error;

        Auth.hideAuthLoading();

        if (data.session) {
          Auth._setUserFromSession(data.user);
          Utils.showToast('Account created successfully! Welcome!', 'success');
          Router.navigate('dashboard');
          return data.user;
        } else {
          Utils.showToast('Check your email for the confirmation link to activate your account!', 'info');
          Auth.showAuthError('A confirmation email was sent. Please verify to sign in.', 'success');
          return data.user;
        }
      } else {
        // Local account creation
        const localUser = {
          uid: 'local_' + Utils.id(),
          email: email,
          displayName: displayName || email.split('@')[0],
          photoURL: '',
          isLocal: true
        };
        Auth.currentUser = localUser;
        localStorage.setItem('rc_auth_user', JSON.stringify(localUser));
        Auth.updateNavbar(localUser);
        Database.listenToResumes(localUser.uid);
        Database.listenToCoverLetters(localUser.uid);

        Auth.hideAuthLoading();
        Utils.showToast(`Account created for ${localUser.displayName}!`, 'success');
        Router.navigate('dashboard');
        return localUser;
      }
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.message || err.code));
      throw err;
    }
  },

  // ---- Email/Password Sign In ----
  async login(email, password) {
    const isCloud = window.isSupabaseConfigured && window.supabaseClient;
    try {
      Auth.showAuthLoading('Signing you in...');

      if (isCloud) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) throw error;

        Auth.hideAuthLoading();
        Auth._setUserFromSession(data.user);
        Utils.showToast(`Welcome back, ${data.user.user_metadata?.full_name || data.user.email}!`, 'success');
        Router.navigate('dashboard');
        return data.user;
      } else {
        // Local mode sign in
        const safeEmailHash = encodeURIComponent(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16) || Utils.id();
        const localUser = {
          uid: 'local_' + safeEmailHash,
          email: email,
          displayName: email.split('@')[0],
          photoURL: '',
          isLocal: true
        };
        Auth.currentUser = localUser;
        localStorage.setItem('rc_auth_user', JSON.stringify(localUser));
        Auth.updateNavbar(localUser);
        Database.listenToResumes(localUser.uid);
        Database.listenToCoverLetters(localUser.uid);

        Auth.hideAuthLoading();
        Utils.showToast(`Welcome back, ${localUser.displayName}!`, 'success');
        Router.navigate('dashboard');
        return localUser;
      }
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.message || err.code));
      throw err;
    }
  },

  // ---- Google Sign In ----
  async googleSignIn() {
    const isCloud = window.isSupabaseConfigured && window.supabaseClient;
    try {
      Auth.showAuthLoading('Connecting to Google...');

      if (isCloud) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        if (error) throw error;
        return data;
      } else {
        // Local simulated Google Sign In
        const googleUser = {
          uid: 'google_local_' + Utils.id(),
          email: 'google.user@example.com',
          displayName: 'Google User',
          photoURL: '',
          isLocal: true
        };
        Auth.currentUser = googleUser;
        localStorage.setItem('rc_auth_user', JSON.stringify(googleUser));
        Auth.updateNavbar(googleUser);
        Database.listenToResumes(googleUser.uid);
        Database.listenToCoverLetters(googleUser.uid);

        Auth.hideAuthLoading();
        Utils.showToast('Signed in with Google (Local Session)!', 'success');
        Router.navigate('dashboard');
        return googleUser;
      }
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.message || err.code));
      throw err;
    }
  },

  // ---- Password Reset ----
  async resetPassword(email) {
    const isCloud = window.isSupabaseConfigured && window.supabaseClient;
    try {
      Auth.showAuthLoading('Sending reset email...');
      if (isCloud) {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin
        });
        if (error) throw error;
      }
      Auth.hideAuthLoading();
      Utils.showToast('Password reset link sent to ' + email, 'success');
      Auth.showAuthError('If an account exists, password reset instructions have been sent.', 'success');
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.message || err.code));
    }
  },

  // ---- Sign Out ----
  async logout() {
    try {
      if (window.isSupabaseConfigured && window.supabaseClient) {
        await supabaseClient.auth.signOut().catch(() => {});
      }

      Auth._clearSession();
      Utils.showToast('Signed out successfully', 'info');
      Router.navigate('landing');
    } catch (err) {
      Utils.showToast('Signed out', 'info');
      Router.navigate('landing');
    }
  },

  // ---- Migration from LocalStorage to Supabase ----
  async migrateLocalStorage(uid) {
    if (!window.isSupabaseConfigured || !window.supabaseClient || !uid) return;
    try {
      const localData = localStorage.getItem('rc_resumes');
      if (!localData) return;

      const resumes = JSON.parse(localData);
      if (!Array.isArray(resumes) || resumes.length === 0) return;

      const { data: existing } = await supabaseClient.from('resumes').select('id').eq('user_id', uid).limit(1);
      if (existing && existing.length > 0) {
        localStorage.removeItem('rc_resumes');
        return;
      }

      // Upsert local resumes into Supabase
      const rows = resumes.map(r => ({
        id: r.id,
        user_id: uid,
        title: r.title || 'My Resume',
        template: r.template || 'michael',
        color: r.color || '#064e3b',
        font: r.font || 'Inter',
        font_size: r.fontSize || 100,
        layout: r.layout || 'single',
        data: r.data || {},
        updated_at: new Date().toISOString()
      }));

      await supabaseClient.from('resumes').upsert(rows);
      localStorage.removeItem('rc_resumes');
      Utils.showToast(`Synced ${resumes.length} resume(s) to Supabase cloud!`, 'success');
    } catch (err) {
      console.warn('Supabase local migration note:', err.message);
    }
  },

  // ---- Route Guard ----
  requireAuth() {
    if (!Auth.currentUser) {
      Router.navigate('auth');
      return false;
    }
    return true;
  },

  // ---- UI Helpers ----
  updateNavbar(user) {
    const authArea = document.getElementById('navAuthArea');
    if (!authArea) return;

    if (user) {
      const photo = user.photoURL;
      const name = user.displayName || user.email?.split('@')[0] || 'User';
      const initial = name.charAt(0).toUpperCase();
      authArea.innerHTML = `
        <div class="nav-user-menu">
          <button class="nav-user-btn" onclick="Auth.toggleUserMenu()" title="Account Menu">
            ${photo
              ? `<img src="${photo}" alt="${name}" class="nav-user-avatar" referrerpolicy="no-referrer">`
              : `<div class="nav-user-avatar nav-user-initial">${initial}</div>`
            }
            <span class="nav-user-name">${Utils.esc(name)}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="nav-user-dropdown hidden" id="userDropdown">
            <div class="nav-dropdown-header">
              <span class="nav-dropdown-user-title">${Utils.esc(name)}</span>
              <span class="nav-dropdown-user-email">${Utils.esc(user.email || '')}</span>
            </div>
            <a href="#" onclick="Router.navigate('dashboard'); Auth.closeUserMenu(); return false;" class="nav-dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              My Resumes & Letters
            </a>
            <button onclick="Auth.logout()" class="nav-dropdown-item nav-dropdown-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      authArea.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="Router.navigate('auth')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
          Sign In
        </button>
      `;
    }
  },

  toggleUserMenu() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.toggle('hidden');
  },

  closeUserMenu() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.add('hidden');
  },

  showAuthLoading(text) {
    const btn = document.getElementById('authSubmitBtn');
    const spinner = document.getElementById('authSpinner');
    const btnText = document.getElementById('authBtnText');
    if (btn) btn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = text || 'Please wait...';
  },

  hideAuthLoading() {
    const btn = document.getElementById('authSubmitBtn');
    const spinner = document.getElementById('authSpinner');
    const btnText = document.getElementById('authBtnText');
    const page = document.getElementById('page-auth');
    const isLogin = page ? page.getAttribute('data-mode') !== 'signup' : true;
    if (btn) btn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = isLogin ? 'Sign In' : 'Create Account';
  },

  clearAuthError() {
    const el = document.getElementById('authError');
    if (el) {
      el.textContent = '';
      el.className = 'auth-message hidden';
    }
  },

  showAuthError(msg, type = 'error') {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-message auth-message-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => {
      if (el.textContent === msg) el.classList.add('hidden');
    }, 6000);
  },

  getErrorMessage(msg) {
    if (!msg) return 'An unexpected error occurred. Please try again.';
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'This email is already registered. Try signing in instead.';
    }
    if (lower.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return msg;
  },

  // ---- Auth Page Rendering ----
  renderAuthPage() {
    const page = document.getElementById('page-auth');
    if (!page) return;

    const isLogin = page.getAttribute('data-mode') !== 'signup';
    const isCloud = window.isSupabaseConfigured;

    page.innerHTML = `
      <div class="auth-page">
        <div class="auth-bg">
          <div class="auth-orb auth-orb-1"></div>
          <div class="auth-orb auth-orb-2"></div>
          <div class="auth-orb auth-orb-3"></div>
        </div>

        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">
              <svg viewBox="0 0 32 32" fill="none" width="36" height="36">
                <rect x="4" y="2" width="24" height="28" rx="3" stroke="var(--primary)" stroke-width="2"/>
                <line x1="9" y1="8" x2="23" y2="8" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>
                <line x1="9" y1="13" x2="20" y2="13" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
                <line x1="9" y1="17" x2="23" y2="17" stroke="var(--primary)" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
                <circle cx="24" cy="24" r="7" fill="var(--primary)"/>
                <path d="M22 24l1.5 1.5L27 22" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1 class="auth-title">${isLogin ? 'Welcome Back' : 'Create Free Account'}</h1>
            <p class="auth-subtitle">${isLogin ? 'Sign in to access your resumes & cover letters' : 'Instant free access — no credit card needed'}</p>
            <div class="auth-status-badge">
              ${isCloud 
                ? '<span class="status-pill status-cloud">● Supabase Cloud Active</span>' 
                : '<span class="status-pill status-local">⚡ Instant Access / Local Mode</span>'
              }
            </div>
          </div>

          <!-- Quick 1-Click Guest Access Option -->
          <div class="auth-quick-access">
            <button type="button" class="btn btn-outline btn-block quick-demo-btn" onclick="Auth.quickDemoLogin()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>⚡ 1-Click Instant Guest Sign In</span>
            </button>
            <div class="auth-or-text"><span>or enter details</span></div>
          </div>

          <div id="authError" class="auth-message hidden"></div>

          <form onsubmit="Auth.handleAuthSubmit(event)" class="auth-form">
            ${!isLogin ? `
              <div class="form-group">
                <label for="authName">Full Name</label>
                <div class="auth-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" id="authName" placeholder="Enter your full name" autocomplete="name">
                </div>
              </div>
            ` : ''}

            <div class="form-group">
              <label for="authEmail">Email Address</label>
              <div class="auth-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                <input type="email" id="authEmail" placeholder="you@example.com" required autocomplete="email">
              </div>
            </div>

            <div class="form-group">
              <label for="authPassword">Password</label>
              <div class="auth-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input type="password" id="authPassword" placeholder="${isLogin ? 'Enter your password' : 'Min. 6 characters'}" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
                <button type="button" class="auth-toggle-pw" onclick="Auth.togglePasswordVisibility()" title="Show/Hide Password">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" id="pwEyeIcon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>

            ${isLogin ? `
              <div class="auth-forgot">
                <a href="#" onclick="Auth.handleForgotPassword(); return false;">Forgot password?</a>
              </div>
            ` : ''}

            <button type="submit" class="btn btn-primary btn-block btn-lg glow-btn auth-submit-btn" id="authSubmitBtn">
              <div class="spinner spinner-sm hidden" id="authSpinner"></div>
              <span id="authBtnText">${isLogin ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          <div class="auth-divider">
            <span>or continue with</span>
          </div>

          <button class="btn auth-google-btn" onclick="Auth.googleSignIn()">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div class="auth-toggle">
            ${isLogin
              ? `Don't have an account? <a href="#" onclick="Auth.switchMode('signup'); return false;">Sign Up Free</a>`
              : `Already have an account? <a href="#" onclick="Auth.switchMode('login'); return false;">Sign In</a>`
            }
          </div>
        </div>
      </div>
    `;
  },

  switchMode(mode) {
    const existingEmail = document.getElementById('authEmail')?.value || '';
    const page = document.getElementById('page-auth');
    if (page) {
      page.setAttribute('data-mode', mode === 'signup' ? 'signup' : 'login');
      Auth.clearAuthError();
      Auth.renderAuthPage();
      const newEmailInput = document.getElementById('authEmail');
      if (newEmailInput && existingEmail) {
        newEmailInput.value = existingEmail;
      }
    }
  },

  async handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value;
    const name = document.getElementById('authName')?.value?.trim();
    const page = document.getElementById('page-auth');
    const isLogin = page?.getAttribute('data-mode') !== 'signup';

    Auth.clearAuthError();

    if (!email || !password) {
      Auth.showAuthError('Please fill in all required fields');
      return;
    }

    if (!isLogin && !name) {
      Auth.showAuthError('Please enter your full name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Auth.showAuthError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Auth.showAuthError('Password must be at least 6 characters');
      return;
    }

    try {
      if (isLogin) {
        await Auth.login(email, password);
      } else {
        await Auth.signup(email, password, name);
      }
    } catch (err) {
      // Error handled in Auth.login/signup
    }
  },

  handleForgotPassword() {
    const email = document.getElementById('authEmail')?.value?.trim();
    if (!email) {
      Auth.showAuthError('Enter your email address first, then click Forgot Password');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Auth.showAuthError('Please enter a valid email address');
      return;
    }
    Auth.resetPassword(email);
  },

  togglePasswordVisibility() {
    const input = document.getElementById('authPassword');
    const eyeIcon = document.getElementById('pwEyeIcon');
    if (input) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
    }
  }
};

// ==========================================
// SUPABASE & LOCAL DATABASE ENGINE
// ==========================================
const Database = {
  // ---- RESUMES ----
  async listenToResumes(uid) {
    if (window.isSupabaseConfigured && window.supabaseClient && uid && !uid.startsWith('local_') && !uid.startsWith('demo_')) {
      try {
        const { data, error } = await supabaseClient
          .from('resumes')
          .select('*')
          .eq('user_id', uid)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          const resumes = data.map(row => ({
            id: row.id,
            title: row.title,
            template: row.template,
            color: row.color,
            font: row.font,
            fontSize: row.font_size,
            layout: row.layout,
            data: row.data,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
          }));

          AppState.resumes = resumes;
          localStorage.setItem('rc_resumes', JSON.stringify(resumes));

          if (AppState.currentResume) {
            const updated = resumes.find(r => r.id === AppState.currentResume.id);
            if (updated) AppState.currentResume = updated;
          }

          const dashPage = document.getElementById('page-dashboard');
          if (dashPage && dashPage.classList.contains('active')) {
            Dashboard.render();
          }
          return;
        }
      } catch (err) {
        console.warn('Supabase resumes fetch note:', err);
      }
    }

    // Local Storage fallback
    Database._loadLocalResumes();
  },

  _loadLocalResumes() {
    try {
      const raw = localStorage.getItem('rc_resumes');
      AppState.resumes = raw ? JSON.parse(raw) : [];
      if (!AppState.resumes.length) {
        const defaultResume = Dashboard.generateDefaultSampleResume();
        AppState.resumes = [defaultResume];
        localStorage.setItem('rc_resumes', JSON.stringify(AppState.resumes));
      }
    } catch (e) {
      AppState.resumes = [];
    }
    const dashPage = document.getElementById('page-dashboard');
    if (dashPage && dashPage.classList.contains('active')) {
      Dashboard.render();
    }
  },

  async saveResume(resume) {
    if (!resume) return;

    // Always persist to localStorage for instant response & offline resilience
    const idx = AppState.resumes.findIndex(r => r.id === resume.id);
    if (idx >= 0) AppState.resumes[idx] = resume;
    else AppState.resumes.unshift(resume);
    localStorage.setItem('rc_resumes', JSON.stringify(AppState.resumes));

    // Cloud sync to Supabase
    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('resumes').upsert({
          id: resume.id,
          user_id: Auth.currentUser.uid,
          title: resume.title || 'My Resume',
          template: resume.template || 'michael',
          color: resume.color || '#064e3b',
          font: resume.font || 'Inter',
          font_size: resume.fontSize || 100,
          layout: resume.layout || 'single',
          data: resume.data || {},
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase resume save note:', err.message);
      }
    }
  },

  async createResume(resume) {
    AppState.resumes.unshift(resume);
    localStorage.setItem('rc_resumes', JSON.stringify(AppState.resumes));

    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('resumes').upsert({
          id: resume.id,
          user_id: Auth.currentUser.uid,
          title: resume.title || 'My Resume',
          template: resume.template || 'michael',
          color: resume.color || '#064e3b',
          font: resume.font || 'Inter',
          font_size: resume.fontSize || 100,
          layout: resume.layout || 'single',
          data: resume.data || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase resume create note:', err.message);
      }
    }
  },

  async deleteResume(resumeId) {
    AppState.resumes = AppState.resumes.filter(r => r.id !== resumeId);
    localStorage.setItem('rc_resumes', JSON.stringify(AppState.resumes));

    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('resumes').delete().eq('id', resumeId).eq('user_id', Auth.currentUser.uid);
      } catch (err) {
        console.warn('Supabase resume delete note:', err.message);
      }
    }
  },

  // ---- COVER LETTERS ----
  async listenToCoverLetters(uid) {
    if (window.isSupabaseConfigured && window.supabaseClient && uid && !uid.startsWith('local_') && !uid.startsWith('demo_')) {
      try {
        const { data, error } = await supabaseClient
          .from('cover_letters')
          .select('*')
          .eq('user_id', uid)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          const cls = data.map(row => ({
            id: row.id,
            title: row.title,
            template: row.template,
            color: row.color,
            font: row.font,
            data: row.data,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime()
          }));

          AppState.coverLetters = cls;
          localStorage.setItem('rc_cover_letters', JSON.stringify(cls));

          if (AppState.currentCoverLetter) {
            const updated = cls.find(c => c.id === AppState.currentCoverLetter.id);
            if (updated) AppState.currentCoverLetter = updated;
          }

          const dashPage = document.getElementById('page-dashboard');
          if (dashPage && dashPage.classList.contains('active')) {
            Dashboard.render();
          }
          return;
        }
      } catch (err) {
        console.warn('Supabase cover letters fetch note:', err);
      }
    }

    // Local Storage fallback
    Database._loadLocalCoverLetters();
  },

  _loadLocalCoverLetters() {
    try {
      const raw = localStorage.getItem('rc_cover_letters');
      AppState.coverLetters = raw ? JSON.parse(raw) : [];
      if (!AppState.coverLetters.length) {
        const defaultCL = Dashboard.generateDefaultSampleCoverLetter();
        AppState.coverLetters = [defaultCL];
        localStorage.setItem('rc_cover_letters', JSON.stringify(AppState.coverLetters));
      }
    } catch (e) {
      AppState.coverLetters = [];
    }
    const dashPage = document.getElementById('page-dashboard');
    if (dashPage && dashPage.classList.contains('active')) {
      Dashboard.render();
    }
  },

  async saveCoverLetter(cl) {
    if (!cl) return;

    const idx = AppState.coverLetters.findIndex(c => c.id === cl.id);
    if (idx >= 0) AppState.coverLetters[idx] = cl;
    else AppState.coverLetters.unshift(cl);
    localStorage.setItem('rc_cover_letters', JSON.stringify(AppState.coverLetters));

    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('cover_letters').upsert({
          id: cl.id,
          user_id: Auth.currentUser.uid,
          title: cl.title || 'My Cover Letter',
          template: cl.template || 'cl-emerald',
          color: cl.color || '#064e3b',
          font: cl.font || 'Inter',
          data: cl.data || {},
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase cover letter save note:', err.message);
      }
    }
  },

  async createCoverLetter(cl) {
    AppState.coverLetters.unshift(cl);
    localStorage.setItem('rc_cover_letters', JSON.stringify(AppState.coverLetters));

    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('cover_letters').upsert({
          id: cl.id,
          user_id: Auth.currentUser.uid,
          title: cl.title || 'My Cover Letter',
          template: cl.template || 'cl-emerald',
          color: cl.color || '#064e3b',
          font: cl.font || 'Inter',
          data: cl.data || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Supabase cover letter create note:', err.message);
      }
    }
  },

  async deleteCoverLetter(clId) {
    AppState.coverLetters = AppState.coverLetters.filter(c => c.id !== clId);
    localStorage.setItem('rc_cover_letters', JSON.stringify(AppState.coverLetters));

    if (window.isSupabaseConfigured && window.supabaseClient && Auth.currentUser && !Auth.currentUser.uid.startsWith('local_') && !Auth.currentUser.uid.startsWith('demo_')) {
      try {
        await supabaseClient.from('cover_letters').delete().eq('id', clId).eq('user_id', Auth.currentUser.uid);
      } catch (err) {
        console.warn('Supabase cover letter delete note:', err.message);
      }
    }
  }
};

// Close user menu on outside click
document.addEventListener('click', (e) => {
  const menu = document.querySelector('.nav-user-menu');
  if (menu && !menu.contains(e.target)) {
    Auth.closeUserMenu();
  }
});

// Make globally available with backwards-compatible aliases
window.Auth = Auth;
window.Database = Database;
window.FirestoreDB = Database;
