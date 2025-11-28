import React, { useState } from 'react';
import { CustomChartScript, Trade } from '../../types';
import { executeChartScript } from '../../utils/chartScriptUtils';
import CustomChartViewer from './CustomChartViewer';
import ChartScriptEditor from './ChartScriptEditor';
import chartTemplates from '../../data/chartTemplates';

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
  const [editingScript, setEditingScript] = useState<CustomChartScript | undefined>();
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSaveScript = (script: CustomChartScript) => {
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

  const handleImportTemplate = (template: CustomChartScript) => {
    // Crea una copia del template con un nuovo ID
    const newScript: CustomChartScript = {
      ...template,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Controlla se esiste già uno script con lo stesso nome
    const existingScript = customScripts.find(s => s.name === template.name);
    if (existingScript) {
      if (!confirm(`Esiste già uno script chiamato "${template.name}". Vuoi importare comunque?`)) {
        return;
      }
      newScript.name = `${template.name} (Copy)`;
    }

    onUpdateScripts([...customScripts, newScript]);
    setSelectedScript(newScript);
    setShowTemplates(false);
    alert(`Template "${template.name}" importato con successo!`);
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn-secondary"
            style={{
              background: showTemplates ? '#3b82f6' : '#374151',
              color: 'white'
            }}
          >
            📚 Template Store ({chartTemplates.length})
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
          >
            + Nuovo Script
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="templates-store" style={{
          background: '#1f2937',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>📊 Template Store - Grafici Pronti all'Uso</h3>
            <button
              onClick={() => setShowTemplates(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem'
              }}
            >
              ×
            </button>
          </div>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Clicca su "Importa" per aggiungere un template alla tua collezione. Potrai poi personalizzarlo a piacimento.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {chartTemplates.map(template => (
              <div
                key={template.id}
                style={{
                  background: '#111827',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #374151',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#374151')}
              >
                <h4 style={{ marginTop: 0, color: '#f3f4f6' }}>{template.name}</h4>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {template.description}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: '#374151',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#d1d5db'
                  }}>
                    {template.chartType}
                  </span>
                  {template.parameters.length > 0 && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#374151',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: '#d1d5db'
                    }}>
                      {template.parameters.length} parametri
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleImportTemplate(template)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#3b82f6',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
                >
                  ⬇️ Importa Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
