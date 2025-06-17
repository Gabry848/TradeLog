import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { CustomChartScript, ChartParameter, Trade } from '../../types';
import AIChat from './AIChat';
import '../../styles/ai-chat.css';

interface ChartScriptEditorProps {
  script?: CustomChartScript;
  onSave: (script: CustomChartScript) => void;
  onCancel: () => void;
  trades?: Trade[];
  existingScripts?: CustomChartScript[];
}

const ChartScriptEditor: React.FC<ChartScriptEditorProps> = ({ script, onSave, onCancel, trades = [], existingScripts = [] }) => {
  const [name, setName] = useState(script?.name || '');
  const [description, setDescription] = useState(script?.description || '');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'area' | 'scatter'>(script?.chartType || 'bar');
  const [code, setCode] = useState(script?.code || getDefaultScriptTemplate(chartType));
  const [parameters, setParameters] = useState<ChartParameter[]>(script?.parameters || []);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [parameterErrors, setParameterErrors] = useState<Record<string, string>>({});

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
    setParameters([...parameters, newParam]);  };

  const handleParameterBlur = (param: ChartParameter, field: keyof ChartParameter) => {
    let error: string | null = null;
    
    if (field === 'name') {
      // Validazione del nome
      if (!param.name || param.name.trim() === '') {
        error = 'Il nome del parametro è obbligatorio';
      } else if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(param.name)) {
        error = 'Il nome deve essere un identificatore JavaScript valido (es: minTrades, show_cumulative, $config)';
      } else {
        // Verifica nomi duplicati
        const duplicateName = parameters.find(p => p.id !== param.id && p.name === param.name);
        if (duplicateName) {
          error = 'Esiste già un parametro con questo nome';
        }
      }
    } else if (field === 'defaultValue') {
      // Validazione del valore predefinito
      const stringValue = param.defaultValue?.toString().trim() || '';
      
      if (param.required && (!stringValue || stringValue === '')) {
        error = 'Il valore predefinito è obbligatorio per i parametri richiesti';
      } else if (stringValue) {
        switch (param.type) {
          case 'number':
            if (isNaN(parseFloat(stringValue))) {
              error = 'Il valore deve essere un numero valido';
            }
            break;
          case 'boolean':
            if (stringValue !== 'true' && stringValue !== 'false') {
              error = 'Il valore deve essere true o false';
            }
            break;
          case 'date':
            if (!Date.parse(stringValue)) {
              error = 'Il valore deve essere una data valida (YYYY-MM-DD)';
            }
            break;
        }
      }
    }
    
    setParameterErrors(prev => ({
      ...prev,
      [`${param.id}_${field}`]: error || ''
    }));
  };

  const clearParameterError = (paramId: string, field: keyof ChartParameter) => {
    setParameterErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${paramId}_${field}`];
      return newErrors;
    });
  };  const handleUpdateParameter = (index: number, field: keyof ChartParameter, value: string | boolean) => {
    const updated = [...parameters];
    const param = updated[index];
    
    // Pulisci l'errore per questo campo quando l'utente inizia a digitare
    clearParameterError(param.id, field);
    
    if (field === 'defaultValue') {
      // Converti il valore in base al tipo
      switch (param.type) {
        case 'number': {
          const numValue = parseFloat(value as string);
          updated[index] = { ...param, [field]: isNaN(numValue) ? '' : numValue };
          break;
        }
        case 'boolean': {
          // Per i boolean, mantieni il valore come booleano
          updated[index] = { ...param, [field]: value === 'true' };
          break;
        }
        default: {
          updated[index] = { ...param, [field]: value };
        }
      }
    } else if (field === 'type') {
      // Quando cambia il tipo, resetta il valore predefinito
      let newDefaultValue: string | number | boolean = '';
      
      switch (value as string) {
        case 'number':
          newDefaultValue = 0;
          break;
        case 'boolean':
          newDefaultValue = false;
          break;
        case 'date':
          newDefaultValue = '';
          break;
        default:
          newDefaultValue = '';
      }
      
      updated[index] = { 
        ...param, 
        type: value as ChartParameter['type'],
        defaultValue: newDefaultValue
      };
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
    const newParameterErrors: Record<string, string> = {};

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

    // Validazione parametri
    const parameterNames = new Set<string>();
    let hasParameterErrors = false;    parameters.forEach((param) => {
      // Validazione nome parametro
      if (!param.name || param.name.trim() === '') {
        newParameterErrors[`${param.id}_name`] = 'Il nome del parametro è obbligatorio';
        hasParameterErrors = true;
      } else if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(param.name)) {
        newParameterErrors[`${param.id}_name`] = 'Il nome deve essere un identificatore JavaScript valido (es: minTrades, show_cumulative, $config)';
        hasParameterErrors = true;
      } else if (parameterNames.has(param.name)) {
        newParameterErrors[`${param.id}_name`] = 'Nome parametro duplicato';
        hasParameterErrors = true;
      }

      // Validazione valore predefinito
      const stringValue = param.defaultValue?.toString().trim() || '';
      
      if (param.required && (!stringValue || stringValue === '')) {
        newParameterErrors[`${param.id}_defaultValue`] = 'Il valore predefinito è obbligatorio per i parametri richiesti';
        hasParameterErrors = true;
      } else if (stringValue) {
        switch (param.type) {
          case 'number':
            if (isNaN(parseFloat(stringValue))) {
              newParameterErrors[`${param.id}_defaultValue`] = 'Il valore deve essere un numero valido';
              hasParameterErrors = true;
            }
            break;
          case 'boolean':
            if (typeof param.defaultValue !== 'boolean' && stringValue !== 'true' && stringValue !== 'false') {
              newParameterErrors[`${param.id}_defaultValue`] = 'Il valore deve essere true o false';
              hasParameterErrors = true;
            }
            break;
          case 'date':
            if (!Date.parse(stringValue)) {
              newParameterErrors[`${param.id}_defaultValue`] = 'Il valore deve essere una data valida (YYYY-MM-DD)';
              hasParameterErrors = true;
            }
            break;
        }
      }

      if (param.name) {
        parameterNames.add(param.name);
      }
    });

    if (hasParameterErrors) {
      newErrors.push('Correggi gli errori nei parametri prima di salvare');
      setParameterErrors(newParameterErrors);
    } else {
      setParameterErrors({});
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

  const handleAIScriptGenerated = (generatedScript: CustomChartScript) => {
    setName(generatedScript.name);
    setDescription(generatedScript.description);
    setChartType(generatedScript.chartType);
    setCode(generatedScript.code);
    setParameters(generatedScript.parameters);
    setIsAIChatOpen(false);
  };

  return (
    <div className="chart-script-editor">      <div className="script-editor-header">
        <h3>{script ? 'Modifica Script' : 'Nuovo Script'}</h3>
        <div className="script-editor-actions">
          <button 
            onClick={() => setIsAIChatOpen(!isAIChatOpen)}
            className="btn-ai"
            title="Apri Assistant IA"
          >
            🤖 Assistant IA
          </button>
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

        <div className="script-parameters">          <div className="parameters-header">
            <h4>Parametri</h4>
            <button onClick={handleAddParameter} className="btn-small">
              + Aggiungi Parametro
            </button>
          </div>

          {parameters.length === 0 ? (
            <div className="parameter-help" style={{ marginBottom: '16px' }}>
              <strong>💡 Suggerimento:</strong> I parametri permettono di creare script configurabili. 
              Ad esempio, puoi aggiungere un parametro "minTrades" di tipo numero per filtrare i risultati.
            </div>
          ) : null}

          {parameters.map((param, index) => {
            const hasNameError = parameterErrors[`${param.id}_name`];
            const hasDefaultValueError = parameterErrors[`${param.id}_defaultValue`];
            const hasAnyError = hasNameError || hasDefaultValueError;            return (
              <div key={param.id} className={`parameter-editor ${hasAnyError ? 'has-error' : ''}`}>
                <div className={`parameter-type-indicator type-${param.type}`}>
                  {param.type || 'string'}
                </div>
                <div className="parameter-fields">                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                    onBlur={() => handleParameterBlur(param, 'name')}
                    placeholder="Nome parametro (es: minTrades, show_cumulative)"
                    className={hasNameError ? 'error' : ''}
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
                  </select>                  {param.type === 'boolean' ? (
                    <select
                      value={param.defaultValue.toString()}
                      onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                      onBlur={() => handleParameterBlur(param, 'defaultValue')}
                      className={`boolean-select ${hasDefaultValueError ? 'error' : ''}`}
                    >
                      <option value="">-- Seleziona --</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                      value={param.defaultValue.toString()}
                      onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                      onBlur={() => handleParameterBlur(param, 'defaultValue')}
                      placeholder={
                        param.type === 'number' ? '0' :
                        param.type === 'date' ? 'YYYY-MM-DD' :
                        'Valore predefinito'
                      }
                      className={hasDefaultValueError ? 'error' : ''}
                    />
                  )}

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
                    title="Rimuovi parametro"
                  >
                    🗑️
                  </button>
                </div>

                <input
                  type="text"
                  value={param.description || ''}
                  onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                  placeholder="Descrizione del parametro (es: 'Numero minimo di trade da mostrare')"
                  className="parameter-description"
                />
                
                {/* Messaggi di errore specifici */}
                {hasNameError && (
                  <div className="parameter-validation-error">
                    {hasNameError}
                  </div>
                )}
                {hasDefaultValueError && (
                  <div className="parameter-validation-error">
                    {hasDefaultValueError}
                  </div>
                )}
                
                {/* Messaggio di aiuto per tipi specifici */}
                {!hasAnyError && param.type === 'boolean' && (
                  <div className="parameter-help">
                    <strong>Boolean:</strong> Il valore deve essere <code>true</code> o <code>false</code>
                  </div>
                )}
                {!hasAnyError && param.type === 'number' && (
                  <div className="parameter-help">
                    <strong>Numero:</strong> Valori decimali supportati (es: 10, 2.5, -1.2)
                  </div>
                )}                {!hasAnyError && param.type === 'date' && (
                  <div className="parameter-help">
                    <strong>Data:</strong> Formato YYYY-MM-DD (es: 2024-01-15)
                  </div>
                )}
                {!hasAnyError && param.name === '' && (
                  <div className="parameter-help">
                    <strong>💡 Nome parametro:</strong> Usa nomi descrittivi come <code>minTrades</code>, <code>show_cumulative</code>, <code>timeframe</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>        <div className="script-code">
          <h4>Codice Script</h4>
          <div className="code-editor">
            <div className="code-editor-header">
              <button
                type="button"
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className="toggle-theme-btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: isDarkTheme ? '#424242' : '#e0e0e0',
                  color: isDarkTheme ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                {isDarkTheme ? '☀️ Tema Chiaro' : '🌙 Tema Scuro'}
              </button>
            </div>            <Editor
              height="400px"
              defaultLanguage="javascript"
              theme={isDarkTheme ? "vs-dark" : "light"}
              value={code || `// 🚀 Benvenuto nell'editor di script personalizzati!
// Utilizza le variabili disponibili per creare grafici dinamici:
//
// 📊 Variabili disponibili:
// - trades: Array di tutti i trade
// - parameters: Parametri dello script
// - utils: Funzioni di utilità
//
// 🛠️ Funzioni di utilità:
// - utils.formatCurrency(value)
// - utils.formatDate(date)
// - utils.groupByMonth(trades)
// - utils.groupBySymbol(trades)
// - utils.groupByStrategy(trades)
// - utils.calculateMetrics(trades)
//
// 💡 Esempio base:
const data = trades.map(trade => ({
  date: trade.entryDate,
  value: trade.pnl
}));

return {
  type: 'line',
  data: data,
  options: {
    title: 'P&L nel tempo',
    responsive: true
  }
};`}
              onChange={(value) => setCode(value || '')}
              options={{
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'on',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                glyphMargin: false,
                folding: true,
                acceptSuggestionOnCommitCharacter: true,
                acceptSuggestionOnEnter: 'on',
                accessibilitySupport: 'auto',
                autoIndent: 'full',
                contextmenu: true,
                dragAndDrop: false,
                links: true,
                mouseWheelZoom: true,
                multiCursorMergeOverlapping: true,
                multiCursorModifier: 'alt',
                overviewRulerBorder: false,
                overviewRulerLanes: 2,
                quickSuggestions: true,
                quickSuggestionsDelay: 100,
                renderLineHighlight: 'line',
                renderWhitespace: 'selection',
                rulers: [],
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  arrowSize: 11,
                  useShadows: true,
                  verticalHasArrows: false,
                  horizontalHasArrows: false,
                },
                smoothScrolling: true,
                tabCompletion: 'on',
                tabSize: 2,
                useTabStops: false,
                wordSeparators: '~!@#$%^&*()-=+[{]}|;:\'",.<>/?',
                wordWrapBreakAfterCharacters: '\t})]?|&,;',
                wordWrapBreakBeforeCharacters: '{([+',
                wordWrapColumn: 80,
                wrappingIndent: 'none',
              }}
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
            </ul>          </div>
        </div>
      </div>

      {/* Componente AI Chat */}
      <AIChat
        isOpen={isAIChatOpen}
        onToggle={() => setIsAIChatOpen(!isAIChatOpen)}
        onScriptGenerated={handleAIScriptGenerated}
        trades={trades}
        existingScripts={existingScripts}
      />
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
