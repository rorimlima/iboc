import { useState, useEffect, useCallback } from 'react';
import { testConnection } from '../services/firestore';

export type ConnectionStatus = 'checking' | 'connected' | 'error';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [message, setMessage] = useState('');

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const result = await testConnection();
      setStatus('connected');
      setMessage(result.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || "Erro desconhecido ao conectar.");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, message, retry: check };
};