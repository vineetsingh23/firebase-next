import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Define a type for the Firebase configuration object
interface FirebaseConfigType {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string; // Optional, but often part of a full config
}

const firebaseConfigString = typeof (globalThis as any).__firebase_config !== 'undefined' 
  ? (globalThis as any).__firebase_config 
  : process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

let firebaseConfig: FirebaseConfigType = {};
let configSource: 'injected_json' | 'env_json' | 'env_vars' | 'placeholders' | 'parse_error' = 'placeholders';

if (firebaseConfigString) {
  try {
    firebaseConfig = JSON.parse(firebaseConfigString);
    configSource = (typeof (globalThis as any).__firebase_config !== 'undefined') ? 'injected_json' : 'env_json';
    // Basic validation for parsed JSON
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn("Parsed Firebase config JSON is missing apiKey or projectId. Falling back.");
        configSource = 'placeholders'; // Treat as incomplete, trigger fallback
        firebaseConfig = {}; // Reset to allow full fallback
    }
  } catch (error) {
    console.error("Failed to parse Firebase config JSON string:", error);
    firebaseConfig = { apiKey: "ERROR_PARSING_CONFIG", projectId: "ERROR_PARSING_CONFIG" }; // Use specific error strings
    configSource = 'parse_error';
  }
}

// If config wasn't from a valid JSON string, try individual environment variables
if (configSource === 'placeholders' || configSource === 'env_vars') {
  const envConfig: FirebaseConfigType = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  // Only overwrite if env vars are actually set, otherwise keep parsed (if any) or empty
  if (envConfig.apiKey && envConfig.projectId) {
    firebaseConfig = envConfig;
    configSource = 'env_vars';
  }
}


// Apply placeholders if essential values are still missing (apiKey or projectId)
if (configSource === 'placeholders' || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
  if (configSource !== 'parse_error') { // Don't switch to 'placeholders' if it was a parse_error
    configSource = 'placeholders';
  }
  firebaseConfig = {
    apiKey: firebaseConfig.apiKey || "YOUR_API_KEY",
    authDomain: firebaseConfig.authDomain || `YOUR_PROJECT_ID.firebaseapp.com`,
    projectId: firebaseConfig.projectId || "YOUR_PROJECT_ID",
    storageBucket: firebaseConfig.storageBucket || `YOUR_PROJECT_ID.appspot.com`,
    messagingSenderId: firebaseConfig.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
    appId: firebaseConfig.appId || "YOUR_APP_ID",
    measurementId: firebaseConfig.measurementId,
  };
}

const isFirebaseActuallyConfigured: boolean = 
  configSource !== 'placeholders' && configSource !== 'parse_error';

if (configSource === 'placeholders') {
  console.warn(
    "Firebase is using placeholder configuration (e.g., 'YOUR_API_KEY' or 'YOUR_PROJECT_ID'). " +
    "Please set up your Firebase project configuration via environment variables " +
    "(e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID) " +
    "or ensure it's correctly injected if deploying. Firebase features may not work."
  );
} else if (configSource === 'parse_error') {
  console.error(
    "Firebase configuration string was provided but could not be parsed or was incomplete. Firebase will not be initialized correctly."
  );
}

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Use appId from global/env first, then from parsed config, then fallback
const appIdFromGlobalsOrEnv = typeof (globalThis as any).__app_id !== 'undefined' 
  ? (globalThis as any).__app_id 
  : process.env.NEXT_PUBLIC_APP_ID;

const finalAppId: string = appIdFromGlobalsOrEnv || firebaseConfig.appId || 'default-app-id';

const initialAuthToken: string | null = typeof (globalThis as any).__initial_auth_token !== 'undefined'
  ? (globalThis as any).__initial_auth_token
  : null;

export { app, auth, db, finalAppId as appId, initialAuthToken, firebaseConfig, isFirebaseActuallyConfigured };
