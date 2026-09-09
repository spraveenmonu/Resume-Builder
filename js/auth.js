/**
 * ResumeCraft AI — Authentication Module
 * Handles Firebase Auth (Email/Password + Google Sign-In),
 * session management, route guards, and localStorage → Firestore migration.
 */

const Auth = {
  currentUser: null,
  unsubscribeAuth: null,
  unsubscribeResumes: null,

  // ---- Initialize Auth State Listener ----
  init() {
    Auth.unsubscribeAuth = auth.onAuthStateChanged(user => {
      Auth.currentUser = user;
      Auth.updateNavbar(user);

      if (user) {
        // User is signed in — load their Firestore data
        Auth.migrateLocalStorage(user.uid).then(() => {
          FirestoreDB.listenToResumes(user.uid);
          const currentPage = location.hash.replace('#', '') || 'landing';
          if (currentPage === 'auth') {
            Router.navigate('dashboard');
          }
        });
      } else {
        // User is signed out
        AppState.resumes = [];
        AppState.currentResume = null;
        if (Auth.unsubscribeResumes) {
          Auth.unsubscribeResumes();
          Auth.unsubscribeResumes = null;
        }
        const currentPage = location.hash.replace('#', '') || 'landing';
        if (currentPage === 'dashboard' || currentPage === 'editor') {
          Router.navigate('auth');
        }
      }
    });
  },

  // ---- Email/Password Sign Up ----
  async signup(email, password, displayName) {
    try {
      Auth.showAuthLoading('Creating your account...');
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (displayName) {
        await cred.user.updateProfile({ displayName });
      }
      // Create user document in Firestore
      await db.collection('users').doc(cred.user.uid).set({
        email: cred.user.email,
        displayName: displayName || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      Auth.hideAuthLoading();
      Utils.showToast('Account created successfully! Welcome!', 'success');
      return cred.user;
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.code));
      throw err;
    }
  },

  // ---- Email/Password Sign In ----
  async login(email, password) {
    try {
      Auth.showAuthLoading('Signing you in...');
      const cred = await auth.signInWithEmailAndPassword(email, password);
      await db.collection('users').doc(cred.user.uid).set({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      Auth.hideAuthLoading();
      Utils.showToast(`Welcome back, ${cred.user.displayName || cred.user.email}!`, 'success');
      return cred.user;
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.code));
      throw err;
    }
  },

  // ---- Google Sign In ----
  async googleSignIn() {
    try {
      Auth.showAuthLoading('Connecting to Google...');
      const result = await auth.signInWithPopup(googleProvider);
      await db.collection('users').doc(result.user.uid).set({
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      Auth.hideAuthLoading();
      Utils.showToast(`Welcome, ${result.user.displayName || 'there'}!`, 'success');
      return result.user;
    } catch (err) {
      Auth.hideAuthLoading();
      if (err.code !== 'auth/popup-closed-by-user') {
        Auth.showAuthError(Auth.getErrorMessage(err.code));
      }
      throw err;
    }
  },

  // ---- Password Reset ----
  async resetPassword(email) {
    try {
      Auth.showAuthLoading('Sending reset email...');
      await auth.sendPasswordResetEmail(email);
      Auth.hideAuthLoading();
      Utils.showToast('Password reset email sent! Check your inbox.', 'success');
      Auth.showAuthError('Check your email for a password reset link.', 'success');
    } catch (err) {
      Auth.hideAuthLoading();
      Auth.showAuthError(Auth.getErrorMessage(err.code));
    }
  },

  // ---- Sign Out ----
  async logout() {
    try {
      if (Auth.unsubscribeResumes) {
        Auth.unsubscribeResumes();
        Auth.unsubscribeResumes = null;
      }
      await auth.signOut();
      AppState.resumes = [];
      AppState.currentResume = null;
      Utils.showToast('Signed out successfully', 'info');
      Router.navigate('landing');
    } catch (err) {
      Utils.showToast('Error signing out', 'error');
    }
  },

  // ---- One-time localStorage → Firestore Migration ----
  async migrateLocalStorage(uid) {
    try {
      const localData = localStorage.getItem('rc_resumes');
      if (!localData) return;

      const resumes = JSON.parse(localData);
      if (!Array.isArray(resumes) || resumes.length === 0) return;

      // Check if user already has Firestore data
      const existing = await db.collection('users').doc(uid)
        .collection('resumes').limit(1).get();

      if (!existing.empty) {
        // User already has Firestore data, skip migration
        localStorage.removeItem('rc_resumes');
        return;
      }

      // Migrate each resume to Firestore
      const batch = db.batch();
      resumes.forEach(resume => {
        const ref = db.collection('users').doc(uid)
          .collection('resumes').doc(resume.id);
        batch.set(ref, resume);
      });
      await batch.commit();

      // Clean up localStorage
      localStorage.removeItem('rc_resumes');
      Utils.showToast(`Migrated ${resumes.length} resume(s) to your cloud account!`, 'success');
    } catch (err) {
      console.error('Migration error:', err);
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
              <span style="font-weight:700">${Utils.esc(name)}</span>
              <span style="font-size:0.75rem;color:var(--text-tertiary)">${Utils.esc(user.email || '')}</span>
            </div>
            <a href="#" onclick="Router.navigate('dashboard'); Auth.closeUserMenu(); return false;" class="nav-dropdown-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              My Resumes
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
    if (btn) btn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Continue';
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

  getErrorMessage(code) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
      'auth/weak-password': 'Password must be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email. Try signing up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed': 'Network error. Check your internet connection.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.',
      'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    };
    return messages[code] || 'An unexpected error occurred. Please try again.';
  },

  // ---- Auth Page Rendering ----
  renderAuthPage() {
    const page = document.getElementById('page-auth');
    if (!page) return;

    const isLogin = page.getAttribute('data-mode') !== 'signup';

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
            <h1 class="auth-title">${isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p class="auth-subtitle">${isLogin ? 'Sign in to access your resumes' : 'Get started with your free account'}</p>
          </div>

          <div id="authError" class="auth-message hidden"></div>

          <form onsubmit="Auth.handleAuthSubmit(event)" class="auth-form">
            ${!isLogin ? `
              <div class="form-group">
                <label for="authName">Full Name</label>
                <div class="auth-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" id="pwEyeIcon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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
              ? `Don't have an account? <a href="#" onclick="Auth.switchMode('signup'); return false;">Sign Up</a>`
              : `Already have an account? <a href="#" onclick="Auth.switchMode('login'); return false;">Sign In</a>`
            }
          </div>
        </div>
      </div>
    `;
  },

  switchMode(mode) {
    const page = document.getElementById('page-auth');
    if (page) {
      page.setAttribute('data-mode', mode === 'signup' ? 'signup' : 'login');
      Auth.renderAuthPage();
    }
  },

  async handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value;
    const name = document.getElementById('authName')?.value?.trim();
    const page = document.getElementById('page-auth');
    const isLogin = page?.getAttribute('data-mode') !== 'signup';

    if (!email || !password) {
      Auth.showAuthError('Please fill in all fields');
      return;
    }

    // Input validation
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
      // Error already shown by login/signup methods
    }
  },

  handleForgotPassword() {
    const email = document.getElementById('authEmail')?.value?.trim();
    if (!email) {
      Auth.showAuthError('Enter your email address first, then click Forgot Password');
      return;
    }
    Auth.resetPassword(email);
  },

  togglePasswordVisibility() {
    const input = document.getElementById('authPassword');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }
};

// ==========================================
// FIRESTORE DATABASE MODULE
// ==========================================
const FirestoreDB = {
  writeTimer: null,
  lastWriteTime: 0,
  MIN_WRITE_INTERVAL: 300, // Rate limit: max 1 write per 300ms

  // ---- Listen to user's resumes in real-time ----
  listenToResumes(uid) {
    if (Auth.unsubscribeResumes) {
      Auth.unsubscribeResumes();
    }

    Auth.unsubscribeResumes = db.collection('users').doc(uid)
      .collection('resumes')
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const resumes = [];
        snapshot.forEach(doc => {
          resumes.push({ ...doc.data(), id: doc.id });
        });
        AppState.resumes = resumes;

        // Update current resume if it's being edited
        if (AppState.currentResume) {
          const updated = resumes.find(r => r.id === AppState.currentResume.id);
          if (updated) {
            AppState.currentResume = updated;
          }
        }

        // Re-render dashboard if visible
        const dashPage = document.getElementById('page-dashboard');
        if (dashPage && dashPage.classList.contains('active')) {
          Dashboard.render();
        }
      }, err => {
        console.error('Firestore listen error:', err);
        Utils.showToast('Error loading resumes. Please refresh.', 'error');
      });
  },

  // ---- Save a resume (with rate limiting) ----
  async saveResume(resume) {
    if (!Auth.currentUser) return;

    const now = Date.now();
    const elapsed = now - FirestoreDB.lastWriteTime;

    if (elapsed < FirestoreDB.MIN_WRITE_INTERVAL) {
      // Debounce: schedule write after remaining interval
      clearTimeout(FirestoreDB.writeTimer);
      FirestoreDB.writeTimer = setTimeout(() => {
        FirestoreDB._doWrite(resume);
      }, FirestoreDB.MIN_WRITE_INTERVAL - elapsed);
      return;
    }

    FirestoreDB._doWrite(resume);
  },

  async _doWrite(resume) {
    if (!Auth.currentUser) return;
    FirestoreDB.lastWriteTime = Date.now();

    try {
      const resumeData = JSON.parse(JSON.stringify(resume));
      resumeData.updatedAt = Date.now();

      await db.collection('users').doc(Auth.currentUser.uid)
        .collection('resumes').doc(resume.id)
        .set(resumeData, { merge: true });
    } catch (err) {
      console.error('Firestore write error:', err);
    }
  },

  // ---- Create a new resume ----
  async createResume(resume) {
    if (!Auth.currentUser) return;

    try {
      await db.collection('users').doc(Auth.currentUser.uid)
        .collection('resumes').doc(resume.id)
        .set(resume);
    } catch (err) {
      console.error('Firestore create error:', err);
      Utils.showToast('Error creating resume', 'error');
    }
  },

  // ---- Delete a resume ----
  async deleteResume(resumeId) {
    if (!Auth.currentUser) return;

    try {
      await db.collection('users').doc(Auth.currentUser.uid)
        .collection('resumes').doc(resumeId)
        .delete();
    } catch (err) {
      console.error('Firestore delete error:', err);
      Utils.showToast('Error deleting resume', 'error');
    }
  },

  // ---- Load all resumes (one-time fetch) ----
  async loadResumes() {
    if (!Auth.currentUser) return [];

    try {
      const snap = await db.collection('users').doc(Auth.currentUser.uid)
        .collection('resumes')
        .orderBy('updatedAt', 'desc')
        .get();

      const resumes = [];
      snap.forEach(doc => {
        resumes.push({ ...doc.data(), id: doc.id });
      });
      return resumes;
    } catch (err) {
      console.error('Firestore load error:', err);
      return [];
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

// Make globally available
window.Auth = Auth;
window.FirestoreDB = FirestoreDB;
