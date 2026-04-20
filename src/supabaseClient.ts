import { createClient } from '@supabase/supabase-js';

// URLs de fallback fixas para garantir funcionamento no ambiente de preview
const DEFAULT_URL = 'https://tuqepsbyqxlqxcesgafl.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cWVwc2J5cXhscXhjZXNnYWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTQ2MzksImV4cCI6MjA5MjI3MDYzOX0.hHvBvKLMaBUTo7bcN3xIaCsoLt5SyKnX8tOGxu-kvg4';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Função para validar se é uma URL válida e retornar limpa
const getCleanUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return DEFAULT_URL;
  let trimmed = url.trim();
  // Remover aspas extras se existirem
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) trimmed = trimmed.substring(1, trimmed.length - 1);
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) trimmed = trimmed.substring(1, trimmed.length - 1);
  
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return DEFAULT_URL;
  
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return trimmed;
  } catch (e) {
    // URL inválida
  }
  return DEFAULT_URL;
};

const getCleanKey = (key: any): string => {
  if (!key || typeof key !== 'string') return DEFAULT_KEY;
  let trimmed = key.trim();
  // Remover aspas extras se existirem
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) trimmed = trimmed.substring(1, trimmed.length - 1);
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) trimmed = trimmed.substring(1, trimmed.length - 1);
  
  if (trimmed.length < 20 || trimmed === 'undefined' || trimmed === 'null') return DEFAULT_KEY;
  return trimmed;
};

const finalUrl = getCleanUrl(envUrl);
const finalKey = getCleanKey(envKey);

// Log de diagnóstico silencioso para ajudar se o erro persistir
if (import.meta.env.DEV) {
    console.log("[Supabase Client] Inicializando com URL:", finalUrl.substring(0, 20) + "...");
}

export const supabase = createClient(finalUrl, finalKey);
