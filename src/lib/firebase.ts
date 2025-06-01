
import { config } from 'dotenv';
config(); // Load .env file at the very beginning

/**
 * @fileOverview Service for managing user profiles in Firestore.
 *
 * - getProfile - Fetches a user profile.
 * - setProfile - Creates or updates a user profile.
 * - initializeRoleProfile - Initializes a basic profile structure based on role.
 * - getProfilesByRole - Fetches all user profiles matching a specific role.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Environment variables that *must* be defined in your .env file at the project root.
const requiredEnvVars: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'apiKey',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'authDomain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'projectId',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'appId',
  // NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is often optional but good practice
};

const missingVars: string[] = [];

for (const [envVar, configKey] of Object.entries(requiredEnvVars)) {
  if (!process.env[envVar]) {
    missingVars.push(`${envVar} (for Firebase config key "${configKey}", current value: ${process.env[envVar]})`);
  }
}

if (missingVars.length > 0) {
  const errorMessage = `Firebase config error: The following environment variable(s) are MISSING or UNDEFINED: \n- ${missingVars.join('\n- ')}\n` +
  `Please ensure they are correctly set in your .env (or .env.local) file at the ROOT of your project. After adding/editing, you MUST restart your Next.js development server.`;
  console.error(`[FirebaseSetup] CRITICAL_ERROR: ${errorMessage}`);
  // Throw an error to make it very clear during development, especially if it's a critical config like API key
  throw new Error(`[FirebaseSetup] Firebase Initialization Failed due to missing environment variables: ${missingVars.join(', ')}. Check server logs and your .env (or .env.local) file.`);
}


const firebaseConfig = {
  apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Measurement ID can be optional
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('[FirebaseSetup] Firebase app initialized successfully.');
  } catch (e: any) {
    console.error("[FirebaseSetup] CRITICAL_ERROR: Failed to initialize Firebase app with the provided config:", e.message);
    console.error("[FirebaseSetup] Firebase Config Used:", firebaseConfig); // Log the actual config being used
    throw new Error(`[FirebaseSetup] Failed to initialize Firebase app. Ensure config is correct and project is set up. Original error: ${e.message}`);
  }
} else {
  app = getApp();
  console.log('[FirebaseSetup] Existing Firebase app retrieved.');
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { app, db, auth };
