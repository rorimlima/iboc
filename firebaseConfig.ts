
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Proteção para evitar crash se process não estiver definido (comum em navegadores)
const getEnv = (key: string) => {
  try {
    return (process as any).env[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "CHAVE_OCULTA",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "iboc-sistema.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "iboc-sistema",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "iboc-sistema.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "503948781548",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:503948781548:web:150016989fcc5f9a9282c9",
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "G-Y4LWZRPTM4"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const auth = getAuth(app);
export const storage = getStorage(app);
