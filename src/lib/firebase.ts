
/**
 * @fileOverview Firebase setup and initialization.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { Timestamp, serverTimestamp, type FieldValue } from 'firebase/firestore';


// Log the raw values at the very start to see what's available when the module loads
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`);
console.log(`[FirebaseSetup] Raw Process Env - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`);


const configValues = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // This one is optional
};

const criticalKeysMap: { [key in keyof Omit<typeof configValues, 'measurementId'>]: string } = {
    apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

const missingCriticalValues: string[] = [];

for (const key of Object.keys(criticalKeysMap) as (keyof typeof criticalKeysMap)[]) {
    if (!configValues[key]) { // Check if the value derived directly from process.env.VAR_NAME is falsy
        missingCriticalValues.push(
          `${key} (expected from ${criticalKeysMap[key]}, received: ${configValues[key]})`
        );
    }
}

if (missingCriticalValues.length > 0) {
    const errorIntro = "[FirebaseSetup] CRITICAL_ERROR: Firebase Initialization Failed. The following required configuration values are missing or undefined:\n";
    const errorDetails = missingCriticalValues.map(detail => `- ${detail}`).join("\n");
    const errorGuidance = "\nPlease ensure the corresponding NEXT_PUBLIC_ environment variables are correctly set in your .env.local file (at the project root) and that you have RESTARTED your Next.js development server.";
    const fullErrorMessage = errorIntro + errorDetails + errorGuidance;
    
    console.error(fullErrorMessage);
    // Also log the state of process.env again, right before throwing, for direct comparison with initial logs
    console.error("[FirebaseSetup] process.env state at time of error check:", {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
    throw new Error(fullErrorMessage);
}

console.log("[FirebaseSetup] All critical Firebase configuration values appear to be present. Proceeding with initialization.");

// Build the final config using the validated values
const firebaseConfig = {
    apiKey: configValues.apiKey!,
    authDomain: configValues.authDomain!,
    projectId: configValues.projectId!,
    storageBucket: configValues.storageBucket!,
    messagingSenderId: configValues.messagingSenderId!,
    appId: configValues.appId!,
    measurementId: configValues.measurementId, // Optional
};

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('[FirebaseSetup] Firebase app initialized successfully.');
  } catch (e: any) {
    console.error("[FirebaseSetup] CRITICAL_ERROR: Failed to initialize Firebase app with the provided config:", e.message);
    console.error("[FirebaseSetup] Firebase Config Used for initializeApp:", firebaseConfig);
    throw new Error(`[FirebaseSetup] Failed to initialize Firebase app. Ensure config is correct and project is set up. Original error: ${e.message}`);
  }
} else {
  app = getApp();
  console.log('[FirebaseSetup] Existing Firebase app retrieved.');
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

