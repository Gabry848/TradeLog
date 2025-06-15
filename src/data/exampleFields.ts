import { TradeField } from '../types';

export const EXAMPLE_CALCULATED_FIELDS: TradeField[] = [
  {
    id: 'capitale_totale',
    label: 'Capitale Totale',
    type: 'number',
    required: false,
    placeholder: 'Capitale totale disponibile',
    enabled: true,
    defaultValue: 10000
  },
  {
    id: 'size',
    label: 'Size (%)',
    type: 'number',
    required: false,
    placeholder: 'Percentuale del capitale da investire',
    enabled: true,
    defaultValue: 2
  },
  {
    id: 'capitale_investito',
    label: 'Capitale Investito',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '({capitale_totale} / 100) * {size}',
    dependencies: ['capitale_totale', 'size']
  },
  {
    id: 'risk_percentage',
    label: 'Risk %',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '({capitale_investito} / {capitale_totale}) * 100',
    dependencies: ['capitale_investito', 'capitale_totale']
  },
  {
    id: 'position_value',
    label: 'Valore Posizione',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{qty} * {entryPrice}',
    dependencies: ['qty', 'entryPrice']
  },
  {
    id: 'profit_percentage',
    label: 'Profit %',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{capitale_investito} > 0 ? ({pnl} / {capitale_investito}) * 100 : 0',
    dependencies: ['pnl', 'capitale_investito']
  }
];

export const EXAMPLE_PORTFOLIO_FIELDS: TradeField[] = [
  {
    id: 'settore',
    label: 'Settore',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Tecnologia', 'Sanità', 'Finanziario', 'Energia', 'Consumo', 'Industriale', 'Materiali', 'Servizi', 'Immobiliare', 'Telecomunicazioni']
  },
  {
    id: 'paese',
    label: 'Paese',
    type: 'select',
    required: false,
    enabled: true,
    options: ['USA', 'Europa', 'Asia', 'Italia', 'Germania', 'Francia', 'Regno Unito', 'Giappone', 'Cina']
  },
  {
    id: 'dividend_yield',
    label: 'Dividend Yield %',
    type: 'number',
    required: false,
    placeholder: 'Rendimento dividendi annuo',
    enabled: true
  },
  {
    id: 'peso_portafoglio',
    label: 'Peso Portafoglio %',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '({position_value} / {capitale_totale}) * 100',
    dependencies: ['position_value', 'capitale_totale']
  }
];

export const EXAMPLE_RISK_FIELDS: TradeField[] = [
  {
    id: 'max_drawdown',
    label: 'Max Drawdown €',
    type: 'number',
    required: false,
    placeholder: 'Perdita massima accettabile',
    enabled: true
  },
  {
    id: 'confidence_level',
    label: 'Livello Fiducia',
    type: 'select',
    required: false,
    enabled: true,
    options: ['Molto Alto', 'Alto', 'Medio', 'Basso', 'Molto Basso']
  },
  {
    id: 'risk_reward_ratio',
    label: 'Risk/Reward',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{takeProfit} && {stopLoss} && {entryPrice} ? Math.abs({takeProfit} - {entryPrice}) / Math.abs({entryPrice} - {stopLoss}) : 0',
    dependencies: ['takeProfit', 'stopLoss', 'entryPrice']
  },
  {
    id: 'kelly_percentage',
    label: 'Kelly %',
    type: 'calculated',
    required: false,
    enabled: true,
    formula: '{risk_reward_ratio} > 0 ? (0.6 * {risk_reward_ratio} - 0.4) / {risk_reward_ratio} * 100 : 0',
    dependencies: ['risk_reward_ratio']
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
