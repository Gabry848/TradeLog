import { Trade, TradeField, DefaultValues } from '../types';

export const getDefaultValue = (fieldType: string, fieldId: string, defaultValues: DefaultValues): string => {
  // Usa i valori di default configurabili se disponibili
  if (defaultValues[fieldId]) {
    return defaultValues[fieldId];
  }
  
  switch (fieldType) {
    case 'number':
      return '0';
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'text':
      if (fieldId === 'type') return 'Buy';
      if (fieldId === 'strategy') return 'Unknown';
      return '';
    default:
      return '';
  }
};

export const initializeTradeFields = (trade: Trade, tradeFields: TradeField[], defaultValues: DefaultValues): Trade => {
  const initializedTrade = { ...trade };
  
  // Assicurati che tutti i campi configurati abbiano un valore
  tradeFields.forEach(field => {
    if (initializedTrade[field.id] === undefined || initializedTrade[field.id] === null || initializedTrade[field.id] === '') {
      if (field.type === 'number') {
        initializedTrade[field.id] = parseFloat(getDefaultValue(field.type, field.id, defaultValues));
      } else {
        initializedTrade[field.id] = getDefaultValue(field.type, field.id, defaultValues);
      }
    }
  });
    
  return initializedTrade;
};

export const validateCellValue = (fieldId: string, value: string, fieldType: string): string | null => {
  if (fieldType === 'number') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    if (fieldId === 'qty' && num < 0) {
      return 'Quantity cannot be negative';
    }
    if (fieldId === 'price' && num < 0) {
      return 'Price cannot be negative';
    }
  }
  
  if (fieldId === 'symbol' && value.trim().length === 0) {
    return 'Symbol is required';
  }
  
  if (fieldId === 'date' && fieldType === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Must be a valid date';
    }
  }
  
  return null; // No error
};
