import { useEffect, useCallback } from 'react';

interface FormAutoSaveOptions {
  formData: Record<string, any>;
  formKey: string;
  clearOnSubmit?: boolean;
}

export function useFormAutoSave({ 
  formData, 
  formKey, 
  clearOnSubmit = true 
}: FormAutoSaveOptions) {
  const storageKey = `formDraft_${formKey}`;

  // Salva o rascunho do formulário
  const saveDraft = useCallback(() => {
    try {
      // Só salva se tem dados preenchidos
      const hasData = Object.values(formData).some(value => 
        value !== '' && value !== null && value !== undefined
      );
      
      if (hasData) {
        localStorage.setItem(storageKey, JSON.stringify({
          ...formData,
          savedAt: new Date().toISOString()
        }));
      } else {
        // Remove rascunho se não há dados
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  }, [formData, storageKey]);

  // Recupera rascunho salvo
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.savedAt; // Remove timestamp
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
    return null;
  }, [storageKey]);

  // Limpa o rascunho
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao limpar rascunho:', error);
    }
  }, [storageKey]);

  // Verifica se há rascunho
  const hasDraft = useCallback(() => {
    return localStorage.getItem(storageKey) !== null;
  }, [storageKey]);

  // Auto-save quando os dados do formulário mudam
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [saveDraft]);

  // Salva antes de fechar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft
  };
}