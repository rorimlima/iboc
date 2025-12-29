
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { Member, SiteContent, Transaction, ChurchEvent, BankAccount } from "../types";
import { MOCK_MEMBERS, INITIAL_SITE_CONTENT, MOCK_TRANSACTIONS, MOCK_EVENTS } from "../data";

// --- Connection Tester ---
export const testConnection = async () => {
  const results = {
    publicRead: false,
    privateRead: false,
    message: ''
  };

  try {
    await getDocs(collection(db, 'events'));
    results.publicRead = true;
    await getDocs(collection(db, 'members'));
    results.privateRead = true;
    results.message = "Conexão Estabelecida!";
    return results;
  } catch (error: any) {
    results.message = `Erro: ${error.message}`;
    throw results;
  }
};

// --- Generic Helpers ---
export const getCollection = async <T>(collectionName: string): Promise<T[]> => {
  try {
    let q = collection(db, collectionName);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error: any) {
    console.error(`Erro ao buscar ${collectionName}:`, error);
    return [];
  }
};

export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  } catch (error: any) {
    throw error;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error: any) {
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error: any) {
    throw error;
  }
};

// --- Storage Helper ---
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    throw error;
  }
};

// --- Specific Site Content Helper ---
export const getSiteContent = async (): Promise<SiteContent | null> => {
  try {
    const docRef = doc(db, "settings", "site_content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteContent;
    } else {
      // Se não existir nada no banco, retorna o padrão inicial
      return INITIAL_SITE_CONTENT;
    }
  } catch (error: any) {
    console.error("Erro ao buscar conteúdo do site:", error);
    return INITIAL_SITE_CONTENT; // Fallback seguro
  }
};

export const updateSiteContent = async (content: SiteContent) => {
  try {
    await setDoc(doc(db, "settings", "site_content"), content);
  } catch (error: any) {
    throw error;
  }
};

// --- Seed Database Helper ---
export const seedDatabase = async () => {
  try {
    const membersRef = await getCollection("members");
    if (membersRef.length === 0) {
        for (const member of MOCK_MEMBERS) {
            const { id, ...data } = member; 
            await addDoc(collection(db, "members"), data);
        }
    }
    await setDoc(doc(db, "settings", "site_content"), INITIAL_SITE_CONTENT);
    console.log("Banco de dados populado com sucesso!");
    alert("Banco de dados inicializado!");
  } catch (error: any) {
      console.error("Erro no seed:", error);
  }
};
