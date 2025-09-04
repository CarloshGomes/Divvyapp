import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface AutoSaveOptions {
  data: any;
  key: string;
  interval?: number; // em milissegundos
  onSave?: () => void;
  onBeforeUnload?: () => void;
}

export function useAutoSave({ 
  data, 
  key, 
  interval = 30000, // 30 segundos por padrão
  onSave,
  onBeforeUnload 
}: AutoSaveOptions) {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isUnloadingRef = useRef(false);

  const saveData = useCallback(async (showToast = false) => {
    try {
      const dataString = JSON.stringify(data);
      
      // Só salva se os dados mudaram
      if (dataString !== lastSavedRef.current) {
        localStorage.setItem(key, dataString);
        lastSavedRef.current = dataString;
        
        if (showToast && !isUnloadingRef.current) {
          toast({
            title: "Auto-save",
            description: "Dados salvos automaticamente",
            variant: "default"
          });
        }
        
        onSave?.();
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      if (!isUnloadingRef.current) {
        toast({
          title: "Erro no auto-save",
          description: "Falha ao salvar dados automaticamente",
          variant: "destructive"
        });
      }
    }
  }, [data, key, onSave, toast]);

  // Salva quando os dados mudam
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Auto-save em intervalos
  useEffect(() => {
    if (interval > 0) {
      intervalRef.current = setInterval(() => {
        saveData(true);
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [interval, saveData]);

  // Salva antes de fechar/sair da página
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      isUnloadingRef.current = true;
      
      // Salva dados pendentes
      saveData();
      onBeforeUnload?.();
      
      // Mostra aviso se há dados não salvos
      const dataString = JSON.stringify(data);
      if (dataString !== lastSavedRef.current) {
        event.preventDefault();
        return 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };

    const handleUnload = () => {
      isUnloadingRef.current = true;
      saveData();
      onBeforeUnload?.();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveData();
      }
    };

    // Eventos de fechamento da página
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [data, saveData, onBeforeUnload]);

  // Salva manualmente
  const forceSave = useCallback(() => {
    return saveData(true);
  }, [saveData]);

  return { forceSave };
}