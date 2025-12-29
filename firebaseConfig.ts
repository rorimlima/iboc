
import { initializeApp } from "firebase/app";
import { initializeFirestore, terminate } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDZWuI1k8Of9aFgfHWS4_Kq17KhcdCQRZA",
  authDomain: "iboc-sistema.firebaseapp.com",
  projectId: "iboc-sistema",
  storageBucket: "iboc-sistema.firebasestorage.app",
  messagingSenderId: "503948781548",
  appId: "1:503948781548:web:150016989fcc5f9a9282c9",
  measurementId: "G-Y4LWZRPTM4"
};

const app = initializeApp(firebaseConfig);

// initializeFirestore com experimentalForceLongPolling resolve o erro de "Could not reach backend"
// em ambientes onde WebSockets são instáveis ou bloqueados.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

export const auth = getAuth(app);
export const storage = getStorage(app);
