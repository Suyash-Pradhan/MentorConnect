
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
// Removed: import { config as dotenvConfig } from 'dotenv';
// Removed: import path from 'path';

// Removed the explicit .env.local loading block that was here.
// Next.js handles .env.local loading automatically.

// Environment variables to check
const envVarsToCheck: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'apiKey',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'authDomain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'projectId',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'appId',
};

for (const [envVar, configKey] of Object.entries(envVarsToCheck)) {
  if (!process.env[envVar]) {
    const errorMessage = `Firebase config error: Missing environment variable ${envVar} (for Firebase config key "${configKey}"). ` +
    `Please ensure it's correctly set in your .env.local file and you've restarted your development server. Current value: ${process.env[envVar]}`;
    console.error(`[FirebaseSetup] ${errorMessage}`);
    // Throw an error to make it very clear during development
    throw new Error(`[FirebaseSetup] Firebase Initialization Failed: ${errorMessage}. Check server logs and .env.local file.`);
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Added measurementId just in case
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('[FirebaseSetup] Firebase app initialized.');
} else {
  app = getApp();
  console.log('[FirebaseSetup] Existing Firebase app retrieved.');
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
