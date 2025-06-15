import { TradeField } from '../types';

export const EXAMPLE_CALCULATED_FIELDS: TradeField[] = [
  {
    id: 'capitale_totale',
    label: 'Capitale Totale €',
    type: 'number',
    required: false,
    placeholder: 'Capitale totale disponibile',
    enabled: true,
    defaultValue: 10000
  },
  {
    id: 'size_percentage',
    label: 'Size %',
    type: 'number',
    required: false,
    placeholder: 'Percentuale del capitale da investire',
    enabled: true,
    defaultValue: 2
  },
  {
    id: 'risk_level',
    label: 'Livello Rischio',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Conservativo', 'Moderato', 'Aggressivo', 'Molto Aggressivo'],
    defaultValue: 'Moderato'
  },
  {
    id: 'capitale_investito',
    label: 'Capitale Investito €',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '({capitale_totale} / 100) * {size_percentage}',
    dependencies: ['capitale_totale', 'size_percentage']
  },
  {
    id: 'position_value',
    label: 'Valore Posizione €',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{qty} * {entryPrice}',
    dependencies: ['qty', 'entryPrice']
  },
  {
    id: 'portfolio_weight',
    label: 'Peso Portafoglio %',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{capitale_totale} > 0 ? ({position_value} / {capitale_totale}) * 100 : 0',
    dependencies: ['position_value', 'capitale_totale']
  }
];

export const EXAMPLE_PORTFOLIO_FIELDS: TradeField[] = [
  {
    id: 'settore',
    label: 'Settore',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Tecnologia', 'Sanità', 'Finanziario', 'Energia', 'Consumo', 'Industriale', 'Materiali', 'Servizi', 'Immobiliare', 'Telecomunicazioni'],
    defaultValue: 'Tecnologia'
  },
  {
    id: 'paese',
    label: 'Paese',
    type: 'select',
    required: false,
    enabled: true,
    options: ['USA', 'Europa', 'Asia', 'Italia', 'Germania', 'Francia', 'Regno Unito', 'Giappone', 'Cina'],
    defaultValue: 'USA'
  },
  {
    id: 'dividend_yield',
    label: 'Dividend Yield %',
    type: 'number',
    required: false,
    placeholder: 'Rendimento dividendi annuo',
    enabled: true,
    defaultValue: 0
  },
  {
    id: 'market_cap',
    label: 'Market Cap',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Micro Cap', 'Small Cap', 'Mid Cap', 'Large Cap', 'Mega Cap'],
    defaultValue: 'Large Cap'
  },
  {
    id: 'data_apertura',
    label: 'Data Apertura Posizione',
    type: 'date',
    required: false,
    enabled: true,
    defaultValue: '2025-06-16'
  }
];

export const EXAMPLE_RISK_FIELDS: TradeField[] = [
  {
    id: 'max_drawdown',
    label: 'Max Drawdown €',
    type: 'number',
    required: false,
    placeholder: 'Perdita massima accettabile',
    enabled: true,
    defaultValue: 500
  },
  {
    id: 'confidence_level',
    label: 'Livello Fiducia',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Molto Alto', 'Alto', 'Medio', 'Basso', 'Molto Basso'],
    defaultValue: 'Alto'
  },
  {
    id: 'time_frame',
    label: 'Time Frame',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Scalping', 'Intraday', 'Swing', 'Position', 'Long Term'],
    defaultValue: 'Swing'
  },
  {
    id: 'note_trade',
    label: 'Note Trade',
    type: 'text',
    required: false,
    placeholder: 'Note aggiuntive sul trade',
    enabled: true,
    defaultValue: ''
  },
  {
    id: 'risk_reward_ratio',
    label: 'Risk/Reward',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{takeProfit} && {stopLoss} && {entryPrice} ? Math.abs({takeProfit} - {entryPrice}) / Math.abs({entryPrice} - {stopLoss}) : 0',
    dependencies: ['takeProfit', 'stopLoss', 'entryPrice']
  }
];

export function addExampleFields(currentFields: TradeField[], category: 'calculated' | 'portfolio' | 'risk'): TradeField[] {
  let exampleFields: TradeField[] = [];
  
  switch (category) {
    case 'calculated':
      exampleFields = EXAMPLE_CALCULATED_FIELDS;
      break;
    case 'portfolio':
      exampleFields = EXAMPLE_PORTFOLIO_FIELDS;
      break;
    case 'risk':
      exampleFields = EXAMPLE_RISK_FIELDS;
      break;
  }

  // Filtra i campi che non esistono già
  const newFields = exampleFields.filter(newField => 
    !currentFields.some(existing => existing.id === newField.id)
  );

  return [...currentFields, ...newFields];
}
