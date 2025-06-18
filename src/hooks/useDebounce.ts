import { useCallback, useRef } from 'react';

/**
 * Hook per implementare il debounce di una funzione
 * @param callback La funzione da chiamare con debounce
 * @param delay Il delay in millisecondi
 * @returns La funzione con debounce applicato
 */
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Cancella il timeout precedente se esiste
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Imposta un nuovo timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedCallback as T;
};
