import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  query,
  orderBy,
  limit
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
    // 1. Teste de Leitura Pública (Events)
    // Se as regras estiverem "allow read: if true", isso deve funcionar mesmo sem login.
    await getDocs(collection(db, 'events'));
    results.publicRead = true;

    // 2. Teste de Leitura Privada (Members)
    // Se estiver logado como admin, isso deve funcionar. Se as regras falharem, dará erro.
    await getDocs(collection(db, 'members'));
    results.privateRead = true;

    results.message = "Conexão Estabelecida e Regras Verificadas!";
    return results;

  } catch (error: any) {
    console.error("Erro no teste de conexão:", error);
    
    if (error.code === 'permission-denied') {
      if (results.publicRead && !results.privateRead) {
        results.message = "Acesso Parcial: Leitura pública OK, mas acesso Admin negado. Verifique se você está logado ou as regras de 'members'.";
      } else {
        results.message = "Permissão Negada: As regras de segurança estão bloqueando o acesso. Verifique o console do Firebase.";
      }
    } else if (error.code === 'unavailable') {
      results.message = "Offline: Não foi possível alcançar o servidor do Firestore. Verifique sua internet.";
    } else {
      results.message = `Erro desconhecido: ${error.message}`;
    }
    throw results;
  }
};

// --- Generic Helpers ---
export const getCollection = async <T>(collectionName: string, orderField?: string): Promise<T[]> => {
  try {
    let q = collection(db, collectionName);
    // Note: Simple ordering. For complex queries, update this function.
    // If orderField is provided, we would use query(collection(db...), orderBy(orderField))
    // ensuring indexes exist in Firebase.
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error: any) {
    console.error(`Erro ao buscar ${collectionName}:`, error);
    if (error.code === 'permission-denied') {
        alert(`Erro de Permissão (Firebase Rules):\n\nO acesso à coleção '${collectionName}' foi negado pelo servidor.\n\nSolução:\n1. Vá ao Firebase Console > Firestore Database > Rules.\n2. Altere para "allow read, write: if true;" (modo teste) OU "if request.auth != null;" (modo seguro com login).`);
    }
    return [];
  }
};

export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id, ...data };
  } catch (error: any) {
    console.error("Erro ao adicionar documento:", error);
    if (error.code === 'permission-denied') {
        alert("Erro de Permissão: Não foi possível salvar os dados. Verifique as regras do Firestore.");
    }
    throw error;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    return { id, ...data };
  } catch (error: any) {
    console.error("Erro ao atualizar documento:", error);
    if (error.code === 'permission-denied') {
        alert("Erro de Permissão: Não foi possível atualizar. Verifique as regras do Firestore.");
    }
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error: any) {
    console.error("Erro ao deletar documento:", error);
    if (error.code === 'permission-denied') {
        alert("Erro de Permissão: Não foi possível excluir. Verifique as regras do Firestore.");
    }
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
    console.error("Erro ao fazer upload da imagem:", error);
    if (error.code === 'storage/unauthorized') {
        alert("Erro de Permissão (Storage): Upload negado. Verifique as regras do Firebase Storage.");
    }
    throw error;
  }
};

// --- Specific Site Content Helper (Singleton) ---
export const getSiteContent = async (): Promise<SiteContent | null> => {
  try {
    const docRef = doc(db, "settings", "site_content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteContent;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error("Erro ao buscar conteúdo do site:", error);
    // Silent fail or default content usually handled by caller, but logging permission error is good
    if (error.code === 'permission-denied') console.warn("Permissão negada ao buscar site_content");
    return null;
  }
};

export const updateSiteContent = async (content: SiteContent) => {
  try {
    await setDoc(doc(db, "settings", "site_content"), content);
  } catch (error: any) {
    console.error("Erro ao salvar conteúdo:", error);
    if (error.code === 'permission-denied') {
         alert("Erro de Permissão: Não foi possível atualizar o site. Verifique as regras do Firestore.");
    }
    throw error;
  }
};

// --- Seed Database Helper ---
export const seedDatabase = async () => {
  console.log("Iniciando população do banco de dados...");
  
  try {
    // 1. Seed Members
    const membersRef = await getCollection("members");
    if (membersRef.length === 0) {
        for (const member of MOCK_MEMBERS) {
            const { id, ...data } = member; 
            await addDoc(collection(db, "members"), data);
        }
    }

    // 2. Seed Content
    await setDoc(doc(db, "settings", "site_content"), INITIAL_SITE_CONTENT);

    // 3. Seed Transactions
    const financeRef = await getCollection("financial");
    if (financeRef.length === 0) {
        for (const trans of MOCK_TRANSACTIONS) {
            const { id, ...data } = trans;
            await addDoc(collection(db, "financial"), data);
        }
    }

    // 4. Seed Events
    const eventsRef = await getCollection("events");
    if (eventsRef.length === 0) {
        for (const event of MOCK_EVENTS) {
            const { id, ...data } = event;
            await addDoc(collection(db, "events"), data);
        }
    }

    // 5. Seed Bank Accounts (NEW)
    const accountsRef = await getCollection("accounts");
    if (accountsRef.length === 0) {
         const defaultAccounts: Omit<BankAccount, 'id'>[] = [
             { name: "Tesouraria (Espécie)", type: "Tesouraria", initialBalance: 0, description: "Cofre local" },
             { name: "Banco do Brasil", type: "Banco", bankName: "Banco do Brasil", agency: "1234-5", accountNumber: "9999-9", pixKey: "financeiro@iboc.com", initialBalance: 0 }
         ];
         for (const acc of defaultAccounts) {
             await addDoc(collection(db, "accounts"), acc);
         }
    }

    console.log("Banco de dados populado com sucesso!");
    alert("Banco de dados inicializado/populado com sucesso!");
  } catch (error: any) {
      console.error("Erro no seed:", error);
      if (error.code === 'permission-denied') {
          alert("Erro Crítico: Não foi possível inicializar o banco de dados devido a falta de permissões. Configure as regras do Firestore para 'allow read, write: if true;' temporariamente.");
      }
  }
};
