import { useState, useEffect } from 'react';

interface PersistentStorageResult<T> {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => Promise<void>;
  isLoaded: boolean;
}

// Hook unificato per gestire la persistenza sia in Electron che nel browser
export const usePersistentStorage = <T>(
  key: string, 
  initialValue: T
): PersistentStorageResult<T> => {
  const [value, setValueState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica il valore all'avvio
  useEffect(() => {
    const loadValue = async () => {
      try {
        if (window.electronAPI && window.electronAPI.loadSettings) {
          // Usa i settings persistenti di Electron
          const settings = await window.electronAPI.loadSettings();
          const savedValue = settings[key] as T;
          setValueState(savedValue !== undefined ? savedValue : initialValue);
        } else {
          // Fallback al localStorage per il browser
          const savedValue = localStorage.getItem(key);
          if (savedValue !== null) {
            try {
              setValueState(JSON.parse(savedValue));
            } catch {
              setValueState(savedValue as T);
            }
          }
        }
      } catch (error) {
        console.warn(`Errore nel caricamento di ${key}, uso valore iniziale:`, error);
        setValueState(initialValue);
      } finally {
        setIsLoaded(true);
      }
    };

    loadValue();
  }, [key, initialValue]);

  const setValue = async (newValue: T | ((prev: T) => T)) => {
    const valueToSet = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value) 
      : newValue;

    setValueState(valueToSet);

    try {
      if (window.electronAPI && window.electronAPI.saveSettings && window.electronAPI.loadSettings) {
        // Salva nei settings persistenti di Electron
        const currentSettings = await window.electronAPI.loadSettings();
        const newSettings = { ...currentSettings, [key]: valueToSet };
        await window.electronAPI.saveSettings(newSettings);
      } else {
        // Fallback al localStorage per il browser
        localStorage.setItem(key, JSON.stringify(valueToSet));
      }
    } catch (error) {
      console.warn(`Errore nel salvataggio di ${key}, uso localStorage:`, error);
      localStorage.setItem(key, JSON.stringify(valueToSet));
    }
  };

  return {
    value,
    setValue,
    isLoaded,
  };
};
