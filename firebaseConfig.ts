import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// --- IMPORTANTE ---
// Para pegar esses dados:
// 1. Vá em console.firebase.google.com
// 2. Configurações do Projeto (Engrenagem) > Role até "Seus aplicativos"
// 3. Selecione o app Web (</>) e copie o objeto "firebaseConfig"

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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);