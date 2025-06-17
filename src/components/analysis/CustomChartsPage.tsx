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

const CustomChartsPage: React.FC<CustomChartsPageProps> = ({ 
  trades, 
  customScripts, 
  onUpdateScripts 
}) => {
  console.log('CustomChartsPage rendering');
  console.log('Props:', { trades: trades.length, scripts: customScripts.length });
  
  const [selectedScript, setSelectedScript] = useState<CustomChartScript | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingScript, setEditingScript] = useState<CustomChartScript | undefined>();  const handleSaveScript = (script: CustomChartScript) => {
    console.log('Saving script:', script.name);
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
    console.log('Deleting script:', scriptId);
    if (confirm('Sei sicuro di voler eliminare questo script?')) {
      onUpdateScripts(customScripts.filter(s => s.id !== scriptId));
      if (selectedScript?.id === scriptId) {
        setSelectedScript(null);
      }
    }
  };

  const handleToggleScript = (scriptId: string) => {
    console.log('Toggling script:', scriptId);
    const updated = customScripts.map(script =>
      script.id === scriptId ? { ...script, enabled: !script.enabled } : script
    );
    onUpdateScripts(updated);
  };

  const executeSelectedScript = () => {
    if (!selectedScript) {
      console.log('No script selected');
      return null;
    }
    
    console.log('Executing script:', selectedScript.name);
    console.log('Available trades:', trades.length);
    
    // Usa i parametri di default per ora
    const params: { [key: string]: string | number | boolean } = {};
    selectedScript.parameters.forEach(param => {
      params[param.id] = param.defaultValue;
    });
    
    console.log('Using default parameters:', params);
    const result = executeChartScript(selectedScript, trades, params);
    
    console.log('Execution result:', result);
    return result;
  };

  if (isEditing) {
    return (      <ChartScriptEditor
        script={editingScript}
        onSave={handleSaveScript}
        onCancel={() => {
          setIsEditing(false);
          setEditingScript(undefined);
        }}
        trades={trades}
        existingScripts={customScripts}
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

      <div className="custom-charts-content">        <div className="scripts-sidebar">
          <h3>Script Disponibili</h3>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '15px' }}>
            Clicca sul <strong>nome dello script</strong> per visualizzarlo. 
            Usa i pulsanti per abilitare/disabilitare, modificare o eliminare.
          </p>
          
          {customScripts.length === 0 ? (
            <div className="no-scripts">
              <p>Nessuno script creato ancora.</p>
              <p>Clicca su "Nuovo Script" per iniziare.</p>
            </div>
          ) : (            <div className="scripts-list">
              {customScripts.map(script => (
                <div 
                  key={script.id} 
                  className={`script-item ${selectedScript?.id === script.id ? 'selected' : ''} ${!script.enabled ? 'disabled' : ''}`}
                  style={{ 
                    opacity: script.enabled ? 1 : 0.6,
                    border: selectedScript?.id === script.id ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="script-header">                    <h4 
                      onClick={() => {
                        console.log('Script clicked:', script.name);
                        console.log('Script enabled:', script.enabled);
                        setSelectedScript(script);
                      }}
                      className="script-name"
                      style={{ cursor: 'pointer', color: script.enabled ? '#ffffff' : '#888888' }}
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
              </div>              {selectedScript.enabled ? (
                (() => {
                  console.log('Rendering chart for script:', selectedScript.name);
                  const chartData = executeSelectedScript();
                  console.log('Chart data received:', chartData);
                    if (chartData) {
                    return (
                      <CustomChartViewer
                        chartData={chartData}
                        chartType={selectedScript.chartType}
                        width={700}
                        height={400}
                      />
                    );
                  } else {
                    return (
                      <div className="chart-error">
                        <h4>Errore nell'esecuzione dello script</h4>
                        <p>Controlla il codice dello script e riprova.</p>
                        <p>Apri la console del browser per vedere i dettagli dell'errore.</p>
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
            </div>
          ) : (
            <div className="no-selection">
              <h3>Seleziona uno script</h3>
              <p>Scegli uno script dalla barra laterale per visualizzare il grafico.</p>
              
              {customScripts.length === 0 && (
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

export default CustomChartsPage;
