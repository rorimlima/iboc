
import { supabase } from "../supabaseClient";
import { Member, SiteContent, Transaction, ChurchEvent, BankAccount } from "../types";
import { INITIAL_SITE_CONTENT } from "../data";

// --- Connection Tester ---
export const testConnection = async () => {
  const results = {
    tables: {
      events: false,
      members: false,
      sermons: false,
      site_content: false,
      financial: false
    },
    message: '',
    status: 'checking' as 'connected' | 'error' | 'checking'
  };

  try {
    // Teste paralelo de existência das tabelas principais
    const [events, members, sermons, content, financial] = await Promise.all([
      supabase.from('events').select('id').limit(1),
      supabase.from('members').select('id').limit(1),
      supabase.from('sermons').select('id').limit(1),
      supabase.from('site_content').select('id').limit(1),
      supabase.from('financial').select('id').limit(1)
    ]);

    results.tables.events = !events.error;
    results.tables.members = !members.error;
    results.tables.sermons = !sermons.error;
    results.tables.site_content = !content.error;
    results.tables.financial = !financial.error;

    const failedTables = Object.entries(results.tables)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);

    if (failedTables.length > 0) {
      results.status = 'error';
      results.message = `Erro: Tabelas ausentes ou sem permissão: ${failedTables.join(', ')}`;
    } else {
      results.status = 'connected';
      results.message = "Conexão Supabase 100% Ok! Tabelas e Storage configurados.";
    }

    return results;
  } catch (error: any) {
    results.status = 'error';
    results.message = `Erro crítico de conexão: ${error.message}`;
    throw results;
  }
};

// --- Generic Helpers ---
export const getCollection = async <T>(tableName: string): Promise<T[]> => {
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw error;
    return data as T[];
  } catch (error: any) {
    console.error(`Erro ao buscar ${tableName}:`, error);
    return [];
  }
};

export const addDocument = async (tableName: string, data: any) => {
  try {
    const { data: insertedData, error } = await supabase.from(tableName).insert([data]).select().single();
    if (error) throw error;
    return insertedData;
  } catch (error: any) {
    throw error;
  }
};

export const updateDocument = async (tableName: string, id: string, data: any) => {
  try {
    const { data: updatedData, error } = await supabase.from(tableName).update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedData;
  } catch (error: any) {
    throw error;
  }
};

export const deleteDocument = async (tableName: string, id: string) => {
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  } catch (error: any) {
    throw error;
  }
};

// --- Storage Helper ---
export const uploadImage = async (file: File, bucket: string): Promise<string> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (error: any) {
    throw error;
  }
};

// --- Specific Site Content Helper ---
export const getSiteContent = async (): Promise<SiteContent | null> => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).single();
    if (error) {
        if (error.code === 'PGRST116') { // Not found
             return INITIAL_SITE_CONTENT;
        }
        throw error;
    }
    
    return data as SiteContent;

  } catch (error: any) {
    console.error("Erro ao buscar conteúdo do site:", error);
    return INITIAL_SITE_CONTENT; 
  }
};

export const updateSiteContent = async (content: SiteContent) => {
  try {
    const { error } = await supabase.from('site_content').update(content).eq('id', 1);
    if (error) throw error;
  } catch (error: any) {
    throw error;
  }
};
