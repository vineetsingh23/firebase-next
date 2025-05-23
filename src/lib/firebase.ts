
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
if (configSource === 'placeholders' || configSource === 'env_vars') { // Check env_vars if it was set as default or if JSON parse failed into placeholders
  const envConfig: FirebaseConfigType = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  // Only overwrite if env vars are actually set and provide essential info
  if (envConfig.apiKey && envConfig.projectId) {
    firebaseConfig = envConfig;
    configSource = 'env_vars';
  }
}


// Apply placeholders if essential values (apiKey or projectId) are still missing after trying JSON and individual env vars
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // If we reach here, it means neither JSON string nor individual env vars provided sufficient config.
  // We will now use hardcoded placeholders.
  if (configSource !== 'parse_error') { // Don't switch to 'placeholders' if it was a parse_error
    configSource = 'placeholders';
  }
  
  // Assign hardcoded placeholder configuration to the outer scope firebaseConfig
  firebaseConfig = { 
    apiKey: "AIzaSyCip6eL7pkzNAuLxDjxsBmIbQ7Ke8UoAjI", // Example placeholder
    authDomain: "e-learning-67678.firebaseapp.com",   // Example placeholder
    projectId: "e-learning-67678",                  // Example placeholder
    storageBucket: "e-learning-67678.firebasestorage.app", // Example placeholder
    messagingSenderId: "661805825924",              // Example placeholder
    appId: "1:661805825924:web:46977292ea3ebb34b0e7d1" // Example placeholder
  };
}

const isFirebaseActuallyConfigured: boolean = 
  configSource !== 'placeholders' && configSource !== 'parse_error';

if (configSource === 'placeholders') {
  console.warn(
    "Firebase is using placeholder configuration (e.g., API key starts with 'AIzaS...' or project ID is 'e-learning-67678'). " +
    "Please set up your Firebase project configuration via environment variables " +
    "(e.g., NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID) " +
    "or ensure it's correctly injected if deploying. Firebase features will not work correctly."
  );
} else if (configSource === 'parse_error') {
  console.error(
    "Firebase configuration string was provided but could not be parsed or was incomplete. Firebase will not be initialized correctly."
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseActuallyConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}
// If !isFirebaseActuallyConfigured, app, auth, and db remain null.
// Warnings/errors about the configuration have already been logged.

// Use appId from global/env first, then from parsed config, then fallback
const appIdFromGlobalsOrEnv = typeof (globalThis as any).__app_id !== 'undefined' 
  ? (globalThis as any).__app_id 
  : process.env.NEXT_PUBLIC_APP_ID;

// Use appId from the final firebaseConfig if available, otherwise a default.
const finalAppId: string = appIdFromGlobalsOrEnv || firebaseConfig.appId || 'default-app-id';

const initialAuthToken: string | null = typeof (globalThis as any).__initial_auth_token !== 'undefined'
  ? (globalThis as any).__initial_auth_token
  : null;

export { app, auth, db, finalAppId as appId, initialAuthToken, firebaseConfig, isFirebaseActuallyConfigured };
