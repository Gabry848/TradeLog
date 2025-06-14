// Test semplice per verificare che il componente CustomChartsPage funzioni
import React, { useState } from 'react';
import { CustomChartScript, Trade } from '../../types';
import { executeChartScript } from '../../utils/chartScriptUtils';
import CustomChartViewer from './CustomChartViewer';
import ChartScriptEditor from './ChartScriptEditor';

interface CustomChartsPageProps {
  trades: Trade[];
  customScripts: CustomChartScript[];
  onUpdateScripts: (scripts: CustomChartScript[]) => void;
}

const CustomChartsPageSimple: React.FC<CustomChartsPageProps> = ({ 
  trades, 
  customScripts, 
  onUpdateScripts 
}) => {
  const [selectedScript, setSelectedScript] = useState<CustomChartScript | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScript, setEditingScript] = useState<CustomChartScript | undefined>();

  // Parametri statici semplici per test
  //const [scriptParameters] = useState<{ [scriptId: string]: { [key: string]: string | number | boolean } }>({});

  const handleSaveScript = (script: CustomChartScript) => {
    const existingIndex = customScripts.findIndex(s => s.id === script.id);
    
    if (existingIndex >= 0) {
      const updated = [...customScripts];
      updated[existingIndex] = script;
      onUpdateScripts(updated);
    } else {
      onUpdateScripts([...customScripts, script]);
    }

    setIsEditing(false);
    setEditingScript(undefined);
  };

  const handleDeleteScript = (scriptId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo script?')) {
      onUpdateScripts(customScripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    }
  };

  const handleToggleScript = (scriptId: string) => {
    const updated = customScripts.map(script =>
      script.id === scriptId ? { ...script, enabled: !script.enabled } : script
    );
    onUpdateScripts(updated);
  };

  const executeSelectedScript = () => {
    if (!selectedScript) return null;
    
    // Usa i parametri di default
    const params: { [key: string]: string | number | boolean } = {};
    selectedScript.parameters.forEach(param => {
      params[param.id] = param.defaultValue;
    });
    
    return executeChartScript(selectedScript, trades, params);
  };

  if (isEditing) {
    return (
      <ChartScriptEditor
        script={editingScript}
        onSave={handleSaveScript}
        onCancel={() => {
          setIsEditing(false);
          setEditingScript(undefined);
        }}
      />
    );
  }

  return (
    <div className="custom-charts-page">
      <div className="custom-charts-header">
        <h2>Grafici Personalizzati</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="btn-primary"
        >
          + Nuovo Script
        </button>
      </div>

      <div className="custom-charts-content">
        <div className="scripts-sidebar">
          <h3>Script Disponibili</h3>
          
          {customScripts.length === 0 ? (
            <div className="no-scripts">
              <p>Nessuno script creato ancora.</p>
              <p>Clicca su "Nuovo Script" per iniziare.</p>
            </div>
          ) : (
            <div className="scripts-list">
              {customScripts.map(script => (
                <div 
                  key={script.id} 
                  className={`script-item ${selectedScript?.id === script.id ? 'selected' : ''} ${!script.enabled ? 'disabled' : ''}`}
                >
                  <div className="script-header">
                    <h4 
                      onClick={() => setSelectedScript(script)}
                      className="script-name"
                    >
                      {script.name}
                    </h4>
                    
                    <div className="script-actions">
                      <button
                        onClick={() => handleToggleScript(script.id)}
                        className={`btn-small ${script.enabled ? 'btn-success' : 'btn-secondary'}`}
                        title={script.enabled ? 'Disabilita' : 'Abilita'}
                      >
                        {script.enabled ? '✓' : '○'}
                      </button>
                      
                      <button
                        onClick={() => {
                          setEditingScript(script);
                          setIsEditing(true);
                        }}
                        className="btn-small btn-secondary"
                        title="Modifica"
                      >
                        ✏️
                      </button>
                      
                      <button
                        onClick={() => handleDeleteScript(script.id)}
                        className="btn-small btn-danger"
                        title="Elimina"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <p className="script-description">{script.description}</p>
                  
                  <div className="script-info">
                    <span className="script-type">{script.chartType}</span>
                    <span className="script-params-count">
                      {script.parameters.length} parametri
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-display">
          {selectedScript ? (
            <div className="chart-container">
              <div className="chart-header">
                <h3>{selectedScript.name}</h3>
                <div className="chart-stats">
                  <span>Trade totali: {trades.length}</span>
                  <span>Trade chiusi: {trades.filter(t => t.status === 'Closed').length}</span>
                </div>
              </div>

              {selectedScript.enabled ? (
                (() => {
                  const chartData = executeSelectedScript();
                  if (chartData) {
                    return (                      <CustomChartViewer
                        chartData={chartData}
                        chartType={selectedScript.chartType}
                      />
                    );
                  } else {
                    return (
                      <div className="chart-error">
                        <h4>Errore nell'esecuzione dello script</h4>
                        <p>Controlla il codice dello script e riprova.</p>
                      </div>
                    );
                  }
                })()
              ) : (
                <div className="chart-disabled">
                  <h4>Script disabilitato</h4>
                  <p>Abilita lo script per visualizzare il grafico.</p>
                </div>
              )}
            </div>          ) : (
            <div className="no-selection">
              <h3>Grafico di Default</h3>
              <p>Visualizzazione del primo script disponibile.</p>
              
              {customScripts.length > 0 ? (
                (() => {
                  const defaultScript = customScripts.find(s => s.enabled) || customScripts[0];
                  if (defaultScript) {
                    const chartData = (() => {
                      const params: { [key: string]: string | number | boolean } = {};
                      defaultScript.parameters.forEach(param => {
                        params[param.id] = param.defaultValue;
                      });
                      return executeChartScript(defaultScript, trades, params);
                    })();
                    
                    if (chartData) {
                      return (
                        <div style={{ width: '100%', marginTop: '20px' }}>
                          <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>{defaultScript.name}</h4>                          <CustomChartViewer
                            chartData={chartData}
                            chartType={defaultScript.chartType}
                          />
                        </div>
                      );
                    }
                  }
                  return (
                    <div className="getting-started">
                      <h4>Per iniziare:</h4>
                      <ol>
                        <li>Clicca su "Nuovo Script" per creare il tuo primo grafico personalizzato</li>
                        <li>Scrivi il codice JavaScript per generare i dati del grafico</li>
                        <li>Configura i parametri opzionali</li>
                        <li>Salva e visualizza il risultato</li>
                      </ol>
                    </div>
                  );
                })()
              ) : (
                <div className="getting-started">
                  <h4>Per iniziare:</h4>
                  <ol>
                    <li>Clicca su "Nuovo Script" per creare il tuo primo grafico personalizzato</li>
                    <li>Scrivi il codice JavaScript per generare i dati del grafico</li>
                    <li>Configura i parametri opzionali</li>
                    <li>Salva e visualizza il risultato</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomChartsPageSimple;
