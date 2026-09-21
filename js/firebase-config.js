/**
 * Firebase Configuration & Initialization
 * ResumeCraft AI — Firebase v9 Compat Mode (CDN)
 * 
 * INSTRUCTIONS: Replace the placeholder values below with your
 * actual Firebase project credentials from the Firebase Console:
 * https://console.firebase.google.com → Project Settings → General → Your apps → Web app
 */

const firebaseConfig = {
  apiKey: "AIzaSyD_REPLACE_WITH_YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789"
};

// Check whether actual Firebase credentials have been configured
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('REPLACE') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your-project-id')
);

window.isFirebaseConfigured = isFirebaseConfigured;

let auth = null;
let db = null;
let googleProvider = null;

if (typeof firebase !== 'undefined') {
  try {
    if (isFirebaseConfigured) {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();

      // Enable Firestore offline persistence for better performance
      db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence: Multiple tabs open. Persistence enabled in first tab only.');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence: Browser does not support persistence.');
        }
      });

      googleProvider = new firebase.auth.GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      console.log('Firebase initialized in Cloud Mode.');
    } else {
      console.info('Firebase running in Local/Demo Mode. Configure credentials in js/firebase-config.js for cloud sync.');
    }
  } catch (initErr) {
    console.warn('Firebase initialization note:', initErr.message);
  }
}

window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;

/**
 * Firestore Security Rules (deploy via Firebase Console → Firestore → Rules):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users can only read/write their own data
 *     match /users/{userId}/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     // Block all other access
 *     match /{document=**} {
 *       allow read, write: if false;
 *     }
 *   }
 * }
 */
