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
  const lines = text.split("\n");
  const newTrades: Trade[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 3 && values[0]) { // Minimo ID, symbol, type
      // Crea un trade con tutti i campi configurati
      const trade: Trade = {
        id: parseInt(values[0]) || Date.now() + i,
        date: values[1] || getDefaultValue('date', 'date', defaultValues),
        symbol: values[2] || getDefaultValue('text', 'symbol', defaultValues),
        type: (values[3] as 'Buy' | 'Sell') || getDefaultValue('text', 'type', defaultValues) as 'Buy' | 'Sell',
        qty: parseFloat(values[4]) || parseFloat(getDefaultValue('number', 'qty', defaultValues)),
        price: parseFloat(values[5]) || parseFloat(getDefaultValue('number', 'price', defaultValues)),
        pnl: parseFloat(values[6]) || parseFloat(getDefaultValue('number', 'pnl', defaultValues)),
        fees: parseFloat(values[7]) || parseFloat(getDefaultValue('number', 'fees', defaultValues)),
        strategy: values[8] || getDefaultValue('text', 'strategy', defaultValues)
      };
      
      // Aggiungi campi personalizzati se configurati
      tradeFields.forEach((field, index) => {
        if (!['id', 'date', 'symbol', 'type', 'qty', 'price', 'pnl', 'fees', 'strategy'].includes(field.id)) {
          const csvIndex = 9 + index; // Dopo i campi base
          const fieldValue = values[csvIndex] || getDefaultValue(field.type, field.id, defaultValues);
          (trade as Record<string, string | number>)[field.id] = field.type === 'number' ? parseFloat(fieldValue) || 0 : fieldValue;
        }
      });
      
      newTrades.push(initializeTradeFields(trade, tradeFields, defaultValues));
    }
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
