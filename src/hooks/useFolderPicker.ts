import { useState, useCallback, useEffect } from 'react';

interface FolderPickerResult {
  selectFolder: () => Promise<string | null>;
  isSelecting: boolean;
  error: string | null;
}

interface GlobalFolderResult {
  globalFolder: string;
  updateGlobalFolder: (path: string) => Promise<void>;
  clearGlobalFolder: () => Promise<void>;
  isLoaded: boolean;
}



export const useFolderPicker = (
  onFolderSelected?: (path: string) => void
): FolderPickerResult => {
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
            const selectedPath = result.filePaths[0];
            setIsSelecting(false);
              // Salva la cartella globalmente
            if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.loadSettings) {
              try {
                const currentSettings = await window.electronAPI.loadSettings();
                const newSettings = { ...currentSettings, globalFolder: selectedPath };
                await window.electronAPI.saveSettings(newSettings);
              } catch (error) {
                console.warn('Errore nel salvataggio settings Electron, uso localStorage:', error);
                localStorage.setItem('tradelog_global_folder', selectedPath);
              }
            } else {
              localStorage.setItem('tradelog_global_folder', selectedPath);
            }
            
            // Notifica il callback se fornito
            if (onFolderSelected) {
              onFolderSelected(selectedPath);
            }
            
            return selectedPath;
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
            // Salva la cartella globalmente
          if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.loadSettings) {
            try {
              const currentSettings = await window.electronAPI.loadSettings();
              const newSettings = { ...currentSettings, globalFolder: folderPath };
              await window.electronAPI.saveSettings(newSettings);
            } catch (error) {
              console.warn('Errore nel salvataggio settings Electron, uso localStorage:', error);
              localStorage.setItem('tradelog_global_folder', folderPath);
            }
          } else {
            localStorage.setItem('tradelog_global_folder', folderPath);
          }
          
          // Notifica il callback se fornito
          if (onFolderSelected) {
            onFolderSelected(folderPath);
          }
          
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
  }, [onFolderSelected]);

  return {
    selectFolder,
    isSelecting,
    error
  };
};

// Hook per accedere alla cartella globale
export const useGlobalFolder = (): GlobalFolderResult => {
  const [globalFolder, setGlobalFolder] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  // Carica le impostazioni all'avvio
  useEffect(() => {
    const loadSettings = async () => {
      try {        if (window.electronAPI && window.electronAPI.loadSettings) {
          // Usa i settings persistenti di Electron
          const settings = await window.electronAPI.loadSettings();
          const savedFolder = (settings.globalFolder as string) || '';
          setGlobalFolder(savedFolder);
        } else {
          // Fallback al localStorage per il browser
          const savedFolder = localStorage.getItem('tradelog_global_folder') || '';
          setGlobalFolder(savedFolder);
        }
      } catch (error) {
        console.warn('Errore nel caricamento settings, uso localStorage:', error);
        const savedFolder = localStorage.getItem('tradelog_global_folder') || '';
        setGlobalFolder(savedFolder);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const updateGlobalFolder = async (path: string) => {
    setGlobalFolder(path);
    
    try {
      if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.loadSettings) {
        // Salva nei settings persistenti di Electron
        const currentSettings = await window.electronAPI.loadSettings();
        const newSettings = { ...currentSettings, globalFolder: path };
        await window.electronAPI.saveSettings(newSettings);
      } else {
        // Fallback al localStorage per il browser
        localStorage.setItem('tradelog_global_folder', path);
      }
    } catch (error) {
      console.warn('Errore nel salvataggio settings, uso localStorage:', error);
      localStorage.setItem('tradelog_global_folder', path);
    }
  };

  const clearGlobalFolder = async () => {
    setGlobalFolder('');
    
    try {
      if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.loadSettings) {
        // Rimuovi dai settings persistenti di Electron
        const currentSettings = await window.electronAPI.loadSettings();
        const newSettings = { ...currentSettings };
        delete newSettings.globalFolder;
        await window.electronAPI.saveSettings(newSettings);
      } else {
        // Fallback al localStorage per il browser
        localStorage.removeItem('tradelog_global_folder');
      }
    } catch (error) {
      console.warn('Errore nella rimozione settings, uso localStorage:', error);
      localStorage.removeItem('tradelog_global_folder');
    }
  };

  return {
    globalFolder,
    updateGlobalFolder,
    clearGlobalFolder,
    isLoaded,
  };
};
