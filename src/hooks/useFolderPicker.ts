import { useState, useCallback } from 'react';

interface FolderPickerResult {
  selectFolder: () => Promise<string | null>;
  isSelecting: boolean;
  error: string | null;
}

export const useFolderPicker = (): FolderPickerResult => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFolder = useCallback(async (): Promise<string | null> => {
    setIsSelecting(true);
    setError(null);

    try {
      // Prima prova con l'API di Electron se disponibile
      if (window.electronAPI && window.electronAPI.selectFolder) {
        try {
          const result = await window.electronAPI.selectFolder();
          if (!result.canceled && result.filePaths.length > 0) {
            setIsSelecting(false);
            return result.filePaths[0];
          }
          setIsSelecting(false);
          return null;
        } catch (electronError) {
          console.warn('Electron folder selection failed, falling back to web method:', electronError);
        }
      }      // Fallback per il browser web
      if ('showDirectoryPicker' in window) {
        try {
          // @ts-expect-error - showDirectoryPicker is not yet in TypeScript types
          const directoryHandle = await window.showDirectoryPicker();
          const folderPath = directoryHandle.name;
          setIsSelecting(false);
          return folderPath;
        } catch (webError) {
          if ((webError as Error).name === 'AbortError') {
            // User cancelled
            setIsSelecting(false);
            return null;
          }
          throw webError;
        }
      }

      // Se nessuna delle API è disponibile, mostra un messaggio informativo
      setError('La selezione automatica delle cartelle non è supportata in questo browser. Inserisci manualmente il percorso della cartella.');
      setIsSelecting(false);
      return null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto nella selezione della cartella';
      setError(errorMessage);
      setIsSelecting(false);
      return null;
    }
  }, []);
  return {
    selectFolder,
    isSelecting,
    error
  };
};
