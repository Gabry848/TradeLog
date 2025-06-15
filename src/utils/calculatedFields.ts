import { Trade, TradeField } from '../types';

export interface CalculationContext {
  trade: Partial<Trade>;
  fields: TradeField[];
  allTrades?: Trade[];
}

/**
 * Valuta una formula per un campo calcolato
 */
export function evaluateFormula(
  formula: string, 
  context: CalculationContext
): number | string | null {
  try {
    // Sostituisce i riferimenti ai campi con i loro valori
    let processedFormula = formula;
    
    // Trova tutti i riferimenti ai campi nel formato {fieldId}
    const fieldReferences = formula.match(/\{([^}]+)\}/g) || [];
    
    for (const ref of fieldReferences) {
      const fieldId = ref.slice(1, -1); // Rimuove le parentesi graffe
      const value = getFieldValue(fieldId, context);
      
      // Se il valore è null o undefined, restituisce null
      if (value === null || value === undefined || value === '') {
        return null;
      }
      
      // Sostituisce il riferimento con il valore
      processedFormula = processedFormula.replace(ref, String(value));
    }
    
    // Valuta l'espressione matematica
    return evaluateExpression(processedFormula);
  } catch (error) {
    console.error('Errore nella valutazione della formula:', error);
    return null;
  }
}

/**
 * Ottiene il valore di un campo dal contesto
 */
function getFieldValue(
  fieldId: string, 
  context: CalculationContext
): number | string | null {
  const { trade, fields } = context;
  
  // Cerca il campo nella definizione
  const field = fields.find(f => f.id === fieldId);
  if (!field) {
    return null;
  }
    // Ottiene il valore dal trade
  let value = trade[fieldId as keyof Trade];
    // Se il campo ha un valore predefinito e il valore corrente è vuoto
  if ((value === null || value === undefined || value === '') && field.defaultValue !== undefined) {
    value = field.defaultValue;
  }
    if (value === undefined) {
    return null;
  }
  
  return typeof value === 'boolean' ? (value ? 1 : 0) : value;
}

/**
 * Valuta un'espressione matematica in modo sicuro
 */
function evaluateExpression(expression: string): number {
  // Lista delle funzioni matematiche consentite
  const allowedFunctions = ['Math.round', 'Math.floor', 'Math.ceil', 'Math.abs', 'Math.min', 'Math.max'];
  
  // Verifica che l'espressione contenga solo caratteri sicuri
  const sanitized = expression.replace(/[0-9+\-*/.() ]/g, '');
  if (sanitized.length > 0) {
    // Controlla se ci sono funzioni Math consentite
    let hasAllowedFunctions = false;
    for (const func of allowedFunctions) {
      if (expression.includes(func)) {
        hasAllowedFunctions = true;
        break;
      }
    }
    
    if (!hasAllowedFunctions && sanitized.length > 0) {
      throw new Error('Espressione non sicura');
    }
  }
  
  // Valuta l'espressione
  return Function('"use strict"; return (' + expression + ')')();
}

/**
 * Calcola tutti i campi calcolati per un trade
 */
export function calculateAllFields(
  trade: Partial<Trade>, 
  fields: TradeField[],
  allTrades?: Trade[]
): Partial<Trade> {
  const result = { ...trade };
  const context: CalculationContext = { trade: result, fields, allTrades };
  
  // Ordina i campi per dipendenze (i campi senza dipendenze vengono calcolati per primi)
  const sortedFields = topologicalSort(fields);
  
  for (const field of sortedFields) {
    if (field.type === 'calculated' && field.formula && field.enabled) {      const calculatedValue = evaluateFormula(field.formula, context);
      if (calculatedValue !== null) {
        (result as Record<string, unknown>)[field.id] = calculatedValue;
        // Aggiorna il contesto per i calcoli successivi
        context.trade = result;
      }
    }
  }
  
  return result;
}

/**
 * Ordinamento topologico dei campi in base alle dipendenze
 */
function topologicalSort(fields: TradeField[]): TradeField[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const result: TradeField[] = [];
  const fieldMap = new Map<string, TradeField>();
  
  // Crea una mappa per accesso rapido
  fields.forEach(field => fieldMap.set(field.id, field));
  
  function visit(fieldId: string) {
    if (visiting.has(fieldId)) {
      throw new Error(`Dipendenza circolare rilevata nel campo: ${fieldId}`);
    }
    
    if (visited.has(fieldId)) {
      return;
    }
    
    const field = fieldMap.get(fieldId);
    if (!field) {
      return;
    }
    
    visiting.add(fieldId);
    
    // Visita prima le dipendenze
    if (field.dependencies) {
      for (const depId of field.dependencies) {
        visit(depId);
      }
    }
    
    visiting.delete(fieldId);
    visited.add(fieldId);
    result.push(field);
  }
  
  // Visita tutti i campi
  for (const field of fields) {
    if (!visited.has(field.id)) {
      visit(field.id);
    }
  }
  
  return result;
}

/**
 * Estrae le dipendenze da una formula
 */
export function extractDependencies(formula: string): string[] {
  const fieldReferences = formula.match(/\{([^}]+)\}/g) || [];
  return fieldReferences.map(ref => ref.slice(1, -1));
}

/**
 * Valida una formula
 */
export function validateFormula(formula: string, fields: TradeField[]): { valid: boolean; error?: string } {
  try {
    // Estrae le dipendenze
    const dependencies = extractDependencies(formula);
      // Verifica che tutti i campi referenziati esistano
    for (const depId of dependencies) {
      const field = fields.find(f => f.id === depId);
      if (!field) {
        return { valid: false, error: `Campo "${depId}" non trovato` };
      }
      
      // I campi calcolati non possono dipendere da se stessi
      if (field.type === 'calculated') {
        return { valid: false, error: `Un campo calcolato non può dipendere da un altro campo calcolato "${depId}"` };
      }
    }
      // Testa la formula con valori fittizi
    const testContext: CalculationContext = {
      trade: Object.fromEntries(dependencies.map(dep => {
        const field = fields.find(f => f.id === dep);
        let testValue: string | number = 100; // Default numerico
        
        if (field?.type === 'text') testValue = 'test';
        else if (field?.type === 'date') testValue = '2025-01-01';
        else if (field?.type === 'select' && field.options?.length) testValue = field.options[0];
        
        return [dep, testValue];
      })),
      fields
    };
    
    const result = evaluateFormula(formula, testContext);
    
    if (typeof result !== 'number') {
      return { valid: false, error: 'La formula deve restituire un valore numerico' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// Formule predefinite comuni organizzate per categoria
export const PREDEFINED_FORMULAS = {
  // Categoria: Gestione Capitale
  'capital_invested': {
    name: 'Capitale Investito',
    description: 'Calcola il capitale investito basato su capitale totale e percentuale di posizione',
    formula: '({capitale_totale} / 100) * {size_percentage}',
    dependencies: ['capitale_totale', 'size_percentage'],
    category: 'Gestione Capitale'
  },
  'portfolio_weight': {
    name: 'Peso nel Portafoglio',
    description: 'Calcola che percentuale del portafoglio rappresenta questa posizione',
    formula: '{capitale_totale} > 0 ? (({qty} * {entryPrice}) / {capitale_totale}) * 100 : 0',
    dependencies: ['qty', 'entryPrice', 'capitale_totale'],
    category: 'Gestione Capitale'
  },
  
  // Categoria: Analisi Rischio
  'risk_percentage': {
    name: 'Percentuale di Rischio',
    description: 'Calcola la percentuale di rischio rispetto al capitale totale',
    formula: '{capitale_totale} > 0 ? ({capitale_investito} / {capitale_totale}) * 100 : 0',
    dependencies: ['capitale_investito', 'capitale_totale'],
    category: 'Analisi Rischio'
  },
  'risk_reward_ratio': {
    name: 'Risk/Reward Ratio',
    description: 'Calcola il rapporto rischio/rendimento della posizione',
    formula: '{takeProfit} && {stopLoss} && {entryPrice} ? Math.abs({takeProfit} - {entryPrice}) / Math.abs({entryPrice} - {stopLoss}) : 0',
    dependencies: ['takeProfit', 'stopLoss', 'entryPrice'],
    category: 'Analisi Rischio'
  },
  'max_loss_amount': {
    name: 'Perdita Massima Potenziale',
    description: 'Calcola la perdita massima in euro se viene colpito lo stop loss',
    formula: '{stopLoss} && {entryPrice} && {qty} ? Math.abs(({stopLoss} - {entryPrice}) * {qty}) : 0',
    dependencies: ['stopLoss', 'entryPrice', 'qty'],
    category: 'Analisi Rischio'
  },
  
  // Categoria: Performance
  'position_value': {
    name: 'Valore Posizione',
    description: 'Calcola il valore totale della posizione al prezzo di entrata',
    formula: '{qty} * {entryPrice}',
    dependencies: ['qty', 'entryPrice'],
    category: 'Performance'
  },
  'profit_percentage': {
    name: 'Percentuale Profitto',
    description: 'Calcola la percentuale di profitto rispetto al capitale investito',
    formula: '{capitale_investito} > 0 ? ({pnl} / {capitale_investito}) * 100 : 0',
    dependencies: ['pnl', 'capitale_investito'],
    category: 'Performance'
  },
  'return_on_capital': {
    name: 'Rendimento sul Capitale',
    description: 'Calcola il rendimento percentuale sul capitale totale',
    formula: '{capitale_totale} > 0 ? ({pnl} / {capitale_totale}) * 100 : 0',
    dependencies: ['pnl', 'capitale_totale'],
    category: 'Performance'
  },
  
  // Categoria: Metriche Avanzate
  'sharpe_approximation': {
    name: 'Approssimazione Sharpe',
    description: 'Stima approssimativa dello Sharpe ratio per singolo trade',
    formula: '{pnl} > 0 ? {pnl} / Math.max({capitale_investito} * 0.02, 1) : 0',
    dependencies: ['pnl', 'capitale_investito'],
    category: 'Metriche Avanzate'
  },
  'profit_factor': {
    name: 'Fattore di Profitto',
    description: 'Rapporto tra potenziale guadagno e potenziale perdita',
    formula: '{takeProfit} && {stopLoss} && {entryPrice} ? Math.abs({takeProfit} - {entryPrice}) / Math.abs({entryPrice} - {stopLoss}) : 1',
    dependencies: ['takeProfit', 'stopLoss', 'entryPrice'],
    category: 'Metriche Avanzate'
  }
};
