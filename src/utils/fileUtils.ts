import { Trade, TradeField } from '../types';
import { getDefaultValue, initializeTradeFields } from './tradeUtils';

export const exportToCSV = async (
  trades: Trade[], 
  tradeFields: TradeField[], 
  filePath: string, 
  destinationPath: string,
  defaultValues: { [key: string]: string }
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
          const value = trade[field.id] ?? getDefaultValue(field.type, field.id, defaultValues);
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
  tradeFields: TradeField[], 
  defaultValues: { [key: string]: string }
): Trade[] => {
  const lines = text.split("\n").filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim());
  const newTrades: Trade[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim());
    if (values.length < 3) continue;
    
    // Crea un trade base con i campi obbligatori
    const trade: Trade = {
      id: Date.now() + i,
      entryDate: getDefaultValue('date', 'entryDate', defaultValues),
      symbol: getDefaultValue('text', 'symbol', defaultValues),
      type: getDefaultValue('text', 'type', defaultValues) as 'Buy' | 'Sell',
      qty: parseFloat(getDefaultValue('number', 'qty', defaultValues)),
      entryPrice: parseFloat(getDefaultValue('number', 'entryPrice', defaultValues)),
      pnl: 0,
      fees: parseFloat(getDefaultValue('number', 'fees', defaultValues)),
      strategy: getDefaultValue('text', 'strategy', defaultValues),
      status: getDefaultValue('text', 'status', defaultValues) as 'Open' | 'Closed',
      // Campi legacy
      date: getDefaultValue('date', 'date', defaultValues),
      price: parseFloat(getDefaultValue('number', 'price', defaultValues)),
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
    });
    
    // Se il trade è chiuso e ha exitPrice, calcola il P&L automaticamente
    if (trade.status === "Closed" && trade.exitPrice && trade.exitPrice > 0) {
      const calculatedPnL = (trade.type === "Buy" 
        ? (trade.exitPrice - trade.entryPrice) 
        : (trade.entryPrice - trade.exitPrice)) * trade.qty - trade.fees;
      trade.pnl = calculatedPnL;
    }
    
    // Assicurati che i campi legacy siano sincronizzati
    trade.date = trade.exitDate || trade.entryDate;
    trade.price = trade.exitPrice || trade.entryPrice;
    
    newTrades.push(initializeTradeFields(trade, tradeFields, defaultValues));
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
