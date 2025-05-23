import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// These would ideally be in environment variables for security and flexibility
// For this exercise, we use the provided __firebase_config or a fallback.
const firebaseConfigString = typeof (globalThis as any).__firebase_config !== 'undefined' 
  ? (globalThis as any).__firebase_config 
  : process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

let firebaseConfig = {};
try {
  if (firebaseConfigString) {
    firebaseConfig = JSON.parse(firebaseConfigString);
  } else {
    // Fallback for local development if no config is injected or set in env
    // Replace with your actual Firebase config for local testing
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
    };
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
      console.warn("Using placeholder Firebase config. Update firebase.ts or set environment variables for local development.");
    }
  }
} catch (error) {
  console.error("Failed to parse Firebase config:", error);
  // Use a minimal valid config to prevent app crash, though Firebase will likely fail to connect.
  firebaseConfig = { apiKey: "error", authDomain: "error.firebaseapp.com", projectId: "error" };
}


let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

const appId: string = typeof (globalThis as any).__app_id !== 'undefined' 
  ? (globalThis as any).__app_id 
  : process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';

const initialAuthToken: string | null = typeof (globalThis as any).__initial_auth_token !== 'undefined'
  ? (globalThis as any).__initial_auth_token
  : null;


export { app, auth, db, appId, initialAuthToken, firebaseConfig };
