
/**
 * @fileOverview Firebase setup and initialization.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { Timestamp, serverTimestamp, type FieldValue } from 'firebase/firestore';

// Raw environment variable logs removed for security.
// console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
// ... (other logs removed)

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // This one is optional
};

const missingCriticalValues: string[] = [];
const criticalConfigKeys: (keyof Omit<typeof firebaseConfig, 'measurementId'>)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
];

criticalConfigKeys.forEach(key => {
  if (!firebaseConfig[key]) {
    missingCriticalValues.push(
      `Firebase config key "${key}" is missing or undefined (derived from NEXT_PUBLIC_FIREBASE_${key.replace('Id', '_ID').replace('Url', '_URL').toUpperCase()}). Value: ${firebaseConfig[key]}`
    );
  }
});

if (missingCriticalValues.length > 0) {
    const errorIntro = "[FirebaseSetup] CRITICAL_ERROR: Firebase Initialization Failed. The following required configuration values are missing or undefined:\n";
    const errorDetails = missingCriticalValues.map(detail => `- ${detail}`).join("\n");
    const errorGuidance = "\nPlease ensure the corresponding NEXT_PUBLIC_ environment variables are correctly set in your .env.local file (at the project root) and that you have RESTARTED your Next.js development server.";
    const fullErrorMessage = errorIntro + errorDetails + errorGuidance;
    
    console.error(fullErrorMessage);
    // console.error("[FirebaseSetup] Firebase config object at time of error:", firebaseConfig); // This can also be removed if desired for extreme cleanliness
    throw new Error(fullErrorMessage);
}

// console.log("[FirebaseSetup] All critical Firebase configuration values appear to be present. Proceeding with initialization."); // Optional: remove this too

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig as any); 
    // console.log('[FirebaseSetup] Firebase app initialized successfully.'); // Optional: remove
  } catch (e: any) {
    console.error("[FirebaseSetup] CRITICAL_ERROR: Failed to initialize Firebase app with the provided config:", e.message);
    // console.error("[FirebaseSetup] Firebase Config Used for initializeApp:", firebaseConfig); // Optional: remove
    throw new Error(`[FirebaseSetup] Failed to initialize Firebase app. Ensure config is correct and project is set up. Original error: ${e.message}`);
  }
} else {
  app = getApp();
  // console.log('[FirebaseSetup] Existing Firebase app retrieved.'); // Optional: remove
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Helper to convert Firestore Timestamps to Dates in a nested object
export function convertTimestampsToDates(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Timestamp) {
      newData[key] = newData[key].toDate();
    } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
      newData[key] = convertTimestampsToDates(newData[key]);
    }
  }
  return newData;
}

// Helper to convert Dates to Firestore Timestamps in a nested object
export function convertDatesToTimestamps(data: any): any {
  if (!data) return data;
  const newData = { ...data };
  for (const key in newData) {
    if (newData[key] instanceof Date) {
      newData[key] = Timestamp.fromDate(newData[key] as Date);
    } else if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
      newData[key] = convertDatesToTimestamps(newData[key]);
    }
  }
  return newData;
}


export { app, db, auth, serverTimestamp, Timestamp, type FieldValue };
