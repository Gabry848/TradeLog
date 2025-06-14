import { useState } from 'react';
import { Trade } from '../types';

export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = typeof value === 'function' ? (value as (prev: T) => T)(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};

export const useTrades = () => {
  const [userTrades, setUserTrades] = useLocalStorage<Trade[]>('tradelog_trades', []);

  const addTrade = (trade: Trade) => {
    setUserTrades((prevTrades: Trade[]) => [...prevTrades, trade]);
  };
  const updateTrade = (tradeId: number, updates: Partial<Trade>) => {
    setUserTrades((prevTrades: Trade[]) =>
      prevTrades.map((trade: Trade) =>
        trade.id === tradeId ? { ...trade, ...updates } as Trade : trade
      )
    );
  };

  const removeTrade = (tradeId: number) => {
    setUserTrades((prevTrades: Trade[]) => prevTrades.filter((trade: Trade) => trade.id !== tradeId));
  };

  return {
    userTrades,
    setUserTrades,
    addTrade,
    updateTrade,
    removeTrade
  };
};
