import React, { useState, useEffect } from 'react';
import { CustomChartScript, ChartParameter } from '../../types';

interface ChartScriptEditorProps {
  script?: CustomChartScript;
  onSave: (script: CustomChartScript) => void;
  onCancel: () => void;
}

const ChartScriptEditor: React.FC<ChartScriptEditorProps> = ({ script, onSave, onCancel }) => {
  const [name, setName] = useState(script?.name || '');
  const [description, setDescription] = useState(script?.description || '');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'area' | 'scatter'>(script?.chartType || 'bar');
  const [code, setCode] = useState(script?.code || getDefaultScriptTemplate(chartType));
  const [parameters, setParameters] = useState<ChartParameter[]>(script?.parameters || []);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!script) {
      setCode(getDefaultScriptTemplate(chartType));
    }
  }, [chartType, script]);

  const handleAddParameter = () => {
    const newParam: ChartParameter = {
      id: `param_${Date.now()}`,
      name: '',
      type: 'string',
      defaultValue: '',
      required: false
    };
    setParameters([...parameters, newParam]);
  };

  const handleUpdateParameter = (index: number, field: keyof ChartParameter, value: string | boolean) => {
    const updated = [...parameters];
    if (field === 'defaultValue') {
      // Converti il valore in base al tipo
      const param = updated[index];
      switch (param.type) {
        case 'number':
          updated[index] = { ...param, [field]: parseFloat(value as string) || 0 };
          break;
        case 'boolean':
          updated[index] = { ...param, [field]: value === 'true' };
          break;
        default:
          updated[index] = { ...param, [field]: value };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setParameters(updated);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const validateScript = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Il nome è obbligatorio');
    }

    if (!code.trim()) {
      newErrors.push('Il codice è obbligatorio');
    }

    // Verifica che il codice contenga la funzione generateChart
    if (!code.includes('function generateChart()')) {
      newErrors.push('Il codice deve contenere una funzione "generateChart()"');
    }

    // Verifica sintassi JavaScript di base
    try {
      new Function(code);
    } catch (error) {
      newErrors.push(`Errore di sintassi: ${error}`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateScript()) {
      return;
    }

    const scriptToSave: CustomChartScript = {
      id: script?.id || `script_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      chartType,
      code: code.trim(),
      parameters,
      enabled: script?.enabled ?? true,
      createdAt: script?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(scriptToSave);
  };

  return (
    <div className="chart-script-editor">
      <div className="script-editor-header">
        <h3>{script ? 'Modifica Script' : 'Nuovo Script'}</h3>
        <div className="script-editor-actions">
          <button onClick={onCancel} className="btn-secondary">
            Annulla
          </button>
          <button onClick={handleSave} className="btn-primary">
            Salva
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="script-errors">
          <h4>Errori:</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error-message">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="script-editor-content">
        <div className="script-basic-info">
          <div className="form-group">
            <label htmlFor="script-name">Nome Script</label>
            <input
              id="script-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. P&L per Strategia"
            />
          </div>

          <div className="form-group">
            <label htmlFor="script-description">Descrizione</label>
            <textarea
              id="script-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione del grafico..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="chart-type">Tipo Grafico</label>
            <select
              id="chart-type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as typeof chartType)}
            >
              <option value="bar">Barre</option>
              <option value="line">Linea</option>
              <option value="pie">Torta</option>
              <option value="area">Area</option>
              <option value="scatter">Dispersione</option>
            </select>
          </div>
        </div>

        <div className="script-parameters">
          <div className="parameters-header">
            <h4>Parametri</h4>
            <button onClick={handleAddParameter} className="btn-small">
              + Aggiungi Parametro
            </button>
          </div>

          {parameters.map((param, index) => (
            <div key={param.id} className="parameter-editor">
              <div className="parameter-fields">
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                  placeholder="Nome parametro"
                />
                
                <select
                  value={param.type}
                  onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                >
                  <option value="string">Testo</option>
                  <option value="number">Numero</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Data</option>
                  <option value="select">Selezione</option>
                </select>

                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={param.defaultValue.toString()}
                  onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                  placeholder="Valore predefinito"
                />

                <label>
                  <input
                    type="checkbox"
                    checked={param.required}
                    onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked)}
                  />
                  Richiesto
                </label>

                <button
                  onClick={() => handleRemoveParameter(index)}
                  className="btn-danger btn-small"
                >
                  Rimuovi
                </button>
              </div>

              <input
                type="text"
                value={param.description || ''}
                onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                placeholder="Descrizione parametro"
                className="parameter-description"
              />
            </div>
          ))}
        </div>

        <div className="script-code">
          <h4>Codice Script</h4>
          <div className="code-editor">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Inserisci il codice JavaScript..."
              rows={20}
              className="code-textarea"
              spellCheck={false}
            />
          </div>
          
          <div className="code-help">
            <h5>Variabili disponibili:</h5>
            <ul>
              <li><code>trades</code> - Array di tutti i trade</li>
              <li><code>parameters</code> - Oggetto con i parametri dello script</li>
              <li><code>utils</code> - Oggetto con funzioni di utilità</li>
            </ul>
            
            <h5>Funzioni di utilità:</h5>
            <ul>
              <li><code>formatCurrency(value)</code> - Formatta come valuta</li>
              <li><code>formatDate(date)</code> - Formatta data</li>
              <li><code>groupByMonth(trades)</code> - Raggruppa per mese</li>
              <li><code>groupBySymbol(trades)</code> - Raggruppa per simbolo</li>
              <li><code>groupByStrategy(trades)</code> - Raggruppa per strategia</li>
              <li><code>calculateMetrics(trades)</code> - Calcola metriche</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

function getDefaultScriptTemplate(chartType: string): string {
  switch (chartType) {
    case 'bar':
      return `
function generateChart() {
  // Filtra solo i trade chiusi
  const closedTrades = trades.filter(t => t.status === 'Closed');
  
  // Raggruppa per mese
  const monthlyGroups = groupByMonth(closedTrades);
  const months = Object.keys(monthlyGroups).sort();
  
  // Calcola i dati
  const data = months.map(month => {
    return monthlyGroups[month].reduce((sum, trade) => sum + trade.pnl, 0);
  });
  
  return {
    labels: months,
    datasets: [{
      label: 'P&L Mensile',
      data: data,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }],
    title: 'P&L Mensile',
    xAxisLabel: 'Mese',
    yAxisLabel: 'P&L (€)'
  };
}
`;
    case 'line':
      return `
function generateChart() {
  // Filtra solo i trade chiusi e ordina per data
  const closedTrades = trades
    .filter(t => t.status === 'Closed')
    .sort((a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime());
  
  // Calcola l'equity curve
  let runningTotal = 0;
  const equityData = closedTrades.map((trade, index) => {
    runningTotal += trade.pnl;
    return runningTotal;
  });
  
  return {
    labels: closedTrades.map((trade, index) => \`Trade \${index + 1}\`),
    datasets: [{
      label: 'Equity',
      data: equityData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      fill: true
    }],
    title: 'Equity Curve',
    xAxisLabel: 'Trade',
    yAxisLabel: 'Equity (€)'
  };
}
`;
    case 'pie':
      return `
function generateChart() {
  // Raggruppa per simbolo
  const symbolGroups = groupBySymbol(trades);
  const symbols = Object.keys(symbolGroups);
  
  // Conta i trade per simbolo
  const data = symbols.map(symbol => symbolGroups[symbol].length);
  
  return {
    labels: symbols,
    datasets: [{
      label: 'Numero di Trade',
      data: data,
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }],
    title: 'Distribuzione Trade per Simbolo'
  };
}
`;
    default:
      return getDefaultScriptTemplate('bar');
  }
}

export default ChartScriptEditor;
