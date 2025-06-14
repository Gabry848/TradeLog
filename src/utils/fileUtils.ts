import { Trade, TradeField } from '../types';
import { initializeTradeFields } from './tradeUtils';

export const exportToCSV = async (
  trades: Trade[],
  tradeFields: TradeField[],
  filePath: string,
  destinationPath: string
): Promise<{ success: boolean; message: string }> => {
  // Assicurati che il nome del file sia valido
  const fileName = filePath.toLowerCase().endsWith(".csv") ? filePath : filePath + ".csv";

  // Genera header dinamicamente dai campi configurati
  const headers = tradeFields.filter(field => field.enabled).map(field => field.label);

  const csvContent = [
    headers.join(","),
    ...trades.map(trade =>
      tradeFields
        .filter(field => field.enabled)
        .map(field => {
          const value = trade[field.id] ?? (field.type === 'number' ? '0' : '');
          return String(value);
        })
        .join(",")
    )
  ].join("\n");

  // Se siamo in Electron e abbiamo un percorso di destinazione, salva direttamente
  if (window.electronAPI && window.electronAPI.saveFile && destinationPath) {
    try {
      const fullPath = getFullFilePath(filePath, destinationPath);
      await window.electronAPI.saveFile(csvContent, fullPath);
      return { success: true, message: `File salvato in: ${fullPath}` };
    } catch (error) {
      console.error("Error saving file directly:", error);
      // Continua con il download normale
    }
  }

  // Fallback per browser web o se il salvataggio diretto fallisce
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { success: true, message: `File scaricato: ${fileName}` };
};

export const importFromCSV = (
  text: string,
  tradeFields: TradeField[]
): Trade[] => {
  const lines = text.split("\n").filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  const newTrades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    if (values.length < 3) continue;    // Crea un trade base con i campi obbligatori
    const trade: Trade = {
      id: Date.now() + i,
      entryDate: new Date().toISOString().split('T')[0],
      symbol: '',
      type: 'Buy' as 'Buy' | 'Sell',
      qty: 1,
      entryPrice: 0,
      pnl: 0,
      fees: 0,
      strategy: '',
      status: 'Closed' as 'Open' | 'Closed',
      // Campi legacy
      date: new Date().toISOString().split('T')[0],
      price: 0,
    };

    // Mappa i valori CSV ai campi del trade basandosi sui header
    headers.forEach((header, index) => {
      if (index < values.length && values[index]) {
        const field = tradeFields.find(f => f.label === header || f.id === header);
        if (field) {
          let value: string | number = values[index];
          if (field.type === 'number') {
            value = parseFloat(values[index]) || 0;
          }
          (trade as Record<string, string | number | undefined>)[field.id] = value;
        }
      }
    });    // Il P&L deve essere impostato dall'utente, non calcolato automaticamente
    // Se il trade è chiuso e ha exitPrice, mantieni il P&L fornito dall'utente
    // Se non è fornito un P&L, usa 0 come valore predefinito

    // Assicurati che i campi legacy siano sincronizzati
    trade.date = trade.exitDate || trade.entryDate;
    trade.price = trade.exitPrice || trade.entryPrice;

    newTrades.push(initializeTradeFields(trade, tradeFields));
  }

  return newTrades;
};

export const getFullFilePath = (filePath: string, destinationPath: string): string => {
  if (!destinationPath) return filePath;

  const separator = destinationPath.includes("/") ? "/" : "\\";
  const cleanDestination = destinationPath.endsWith("/") || destinationPath.endsWith("\\")
    ? destinationPath.slice(0, -1)
    : destinationPath;

  return `${cleanDestination}${separator}${filePath}`;
};

// Carica i trade dal file specificato nelle impostazioni
export const loadTradesFromFile = async (
  filePath: string,
  destinationPath: string,
  tradeFields: TradeField[]
): Promise<Trade[]> => {
  const fullPath = getFullFilePath(filePath, destinationPath);
  
  // Se siamo in Electron e abbiamo un percorso di destinazione, prova a leggere il file direttamente
  if (window.electronAPI && window.electronAPI.readFile && destinationPath) {
    try {
      const fileContent = await window.electronAPI.readFile(fullPath);
      return importFromCSV(fileContent, tradeFields);
    } catch (error) {
      console.log('File non trovato, lo creo vuoto:', error);
      
      // Crea il file vuoto con solo gli header
      try {
        await createEmptyCSVFile(filePath, destinationPath, tradeFields);
        console.log('File CSV creato con successo:', fullPath);
      } catch (createError) {
        console.error('Errore nella creazione del file:', createError);
      }
      
      return [];
    }
  }
  
  // Per il browser web, non possiamo leggere file automaticamente
  console.log('Caricamento automatico non disponibile nel browser web');
  return [];
};

// Salva i trade direttamente nel file specificato
export const saveTradesDirectly = async (
  trades: Trade[],
  tradeFields: TradeField[],
  filePath: string,
  destinationPath: string
): Promise<void> => {
  try {
    const result = await exportToCSV(trades, tradeFields, filePath, destinationPath);
    if (!result.success) {
      console.error('Errore nel salvataggio:', result.message);
    }
  } catch (error) {
    console.error('Errore nel salvataggio diretto:', error);
  }
};

// Crea un file CSV vuoto con solo gli header
export const createEmptyCSVFile = async (
  filePath: string,
  destinationPath: string,
  tradeFields: TradeField[]
): Promise<void> => {
  const headers = tradeFields.filter(field => field.enabled).map(field => field.label);
  const csvContent = headers.join(",") + "\n";

  if (window.electronAPI && window.electronAPI.saveFile && destinationPath) {
    const fullPath = getFullFilePath(filePath, destinationPath);
    await window.electronAPI.saveFile(csvContent, fullPath);
  }
};
