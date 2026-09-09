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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable Firestore offline persistence for better performance
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Multiple tabs open. Persistence enabled in first tab only.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Browser does not support persistence.');
  }
});

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
