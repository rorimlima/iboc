
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// As chaves são carregadas via variáveis de ambiente injetadas no processo de build
// Nunca exponha chaves reais em repositórios públicos.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "CHAVE_OCULTA",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "iboc-sistema.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "iboc-sistema",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "iboc-sistema.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "503948781548",
  appId: process.env.FIREBASE_APP_ID || "1:503948781548:web:150016989fcc5f9a9282c9",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-Y4LWZRPTM4"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const auth = getAuth(app);
export const storage = getStorage(app);
