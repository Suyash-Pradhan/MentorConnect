
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Environment variables to check
const envVarsToCheck: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'apiKey',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'authDomain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'projectId',
  // Optional: Add others if they become critical for initial app load
  // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  // NEXT_PUBLIC_FIREBASE_APP_ID: 'appId',
};

for (const [envVar, configKey] of Object.entries(envVarsToCheck)) {
  if (!process.env[envVar]) {
    const errorMessage = `Firebase config error: Missing environment variable ${envVar} (for Firebase config key "${configKey}"). ` +
    `Please ensure it's correctly set in your .env.local file and you've restarted your development server.`;
    console.error(errorMessage);
    // Throw an error to make it very clear during development
    throw new Error(`Firebase Initialization Failed: ${errorMessage}. Check server logs and .env.local file.`);
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
