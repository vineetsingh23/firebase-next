import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseConfigType {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

type ConfigSource = 'injected_json' | 'env_json' | 'env_vars' | 'placeholders' | 'parse_error';

function getFirebaseConfig(): { config: FirebaseConfigType; source: ConfigSource } {
  const injected = (globalThis as any).__firebase_config;
  const configString = injected ?? process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  let config: FirebaseConfigType = {};
  let source: ConfigSource = 'placeholders';

  if (configString) {
    try {
      config = JSON.parse(configString);
      source = injected ? 'injected_json' : 'env_json';
      if (!config.apiKey || !config.projectId) {
        console.warn("Parsed Firebase config JSON is missing apiKey or projectId. Falling back.");
        config = {};
        source = 'placeholders';
      }
    } catch (error) {
      console.error("Failed to parse Firebase config JSON string:", error);
      config = { apiKey: "ERROR_PARSING_CONFIG", projectId: "ERROR_PARSING_CONFIG" };
      source = 'parse_error';
    }
  }

  if (source === 'placeholders') {
    const envConfig: FirebaseConfigType = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    if (envConfig.apiKey && envConfig.projectId) {
      config = envConfig;
      source = 'env_vars';
    }
  }

  if (!config.apiKey || !config.projectId) {
    if (source !== 'parse_error') source = 'placeholders';
  }

  return { config, source };
}

const { config: firebaseConfig, source: configSource } = getFirebaseConfig();
const isFirebaseActuallyConfigured = configSource !== 'placeholders' && configSource !== 'parse_error';

if (configSource === 'placeholders') {
  console.warn(
    "Firebase is using placeholder configuration. Please set up your Firebase project configuration via environment variables or ensure it's correctly injected if deploying. Firebase features will not work correctly."
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
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const appIdFromGlobalsOrEnv = (globalThis as any).__app_id ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const finalAppId: string = appIdFromGlobalsOrEnv || firebaseConfig.appId || 'default-app-id';

const initialAuthToken: string | null = (globalThis as any).__initial_auth_token ?? null;

export { app, auth, db, finalAppId as appId, initialAuthToken, firebaseConfig, isFirebaseActuallyConfigured };