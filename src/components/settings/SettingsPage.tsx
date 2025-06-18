import React, { useEffect } from 'react';
import { TradeField } from '../../types';
import { defaultTradeFields } from '../../data/defaults';
import { useFolderPicker, useGlobalFolder } from '../../hooks/useFolderPicker';
import FieldsManager from './FieldsManager';

interface SettingsPageProps {
  filePath: string;
  destinationPath: string;
  tradeFields: TradeField[];
  onFilePathChange: (path: string) => Promise<void>;
  onDestinationPathChange: (path: string) => void;
  onTradeFieldsUpdate: (fields: TradeField[]) => Promise<void>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  filePath,
  destinationPath,
  tradeFields,
  onFilePathChange,
  onDestinationPathChange,
  onTradeFieldsUpdate,
}) => {
  const { globalFolder, updateGlobalFolder } = useGlobalFolder();
  const { selectFolder, isSelecting, error } = useFolderPicker(updateGlobalFolder);

  // Sincronizza la cartella globale con il destinationPath quando cambia
  useEffect(() => {
    if (globalFolder && globalFolder !== destinationPath) {
      onDestinationPathChange(globalFolder);
    }
  }, [globalFolder, destinationPath, onDestinationPathChange]);
  // Se c'è una cartella globale salvata, utilizzala all'avvio
  useEffect(() => {
    if (globalFolder && !destinationPath) {
      onDestinationPathChange(globalFolder);
    }
  }, [globalFolder, destinationPath, onDestinationPathChange]);

  const handleSelectFolder = async () => {
    const selectedPath = await selectFolder();
    if (selectedPath) {
      // Il callback updateGlobalFolder viene chiamato automaticamente dal hook
      // e sincronizzerà il valore tramite useEffect
    }
  };

  const handleManualPathChange = (path: string) => {
    onDestinationPathChange(path);
    updateGlobalFolder(path);
  };const getFullFilePath = () => {
    if (!destinationPath) return filePath;
    const separator = destinationPath.includes("/") ? "/" : "\\";
    const cleanDestination = destinationPath.endsWith("/") || destinationPath.endsWith("\\")
      ? destinationPath.slice(0, -1)
      : destinationPath;
    return `${cleanDestination}${separator}${filePath}`;
  };

  return (
    <div className="settings-page">
      {/* File Configuration Section */}
      <div className="settings-section">
        <h3>📁 Configurazione File di Salvataggio</h3>
        <p>Imposta dove salvare le tue operazioni di trading.</p>        

        <div className="file-config-grid">
          <div className="form-group">
            <label htmlFor="file-path">📄 Nome File CSV</label>
            <input
              type="text"
              id="file-path"
              value={filePath}              onChange={async (e) => {
                let newPath = e.target.value;
                if (newPath && !newPath.toLowerCase().endsWith(".csv")) {
                  newPath = newPath.replace(/\.[^/.]+$/, "") + ".csv";
                }
                await onFilePathChange(newPath);
              }}
              placeholder="es: le_mie_operazioni.csv"
              className="config-input"
            />
            <small>Nome del file CSV dove salvare le operazioni</small>
          </div>

          <div className="form-group">
            <label htmlFor="destination-path">📂 Cartella di Destinazione</label>
            <div className="destination-input-group">              <input
                type="text"
                id="destination-path"
                value={destinationPath}
                onChange={(e) => handleManualPathChange(e.target.value)}
                placeholder="es: C:\Users\Nome\Documents\Trading"
                className="config-input"
              /><button
                onClick={handleSelectFolder}
                className="browse-btn"
                type="button"
                disabled={isSelecting}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                {isSelecting ? 'Selezione...' : 'Sfoglia'}
              </button>            </div>
            <small>Cartella dove salvare i file CSV</small>
            {error && (
              <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="file-info-box">
          <div className="info-row">
            <strong>📄 File corrente:</strong> <code>{filePath}</code>
          </div>
          <div className="info-row">
            <strong>📂 Destinazione:</strong> <code>{destinationPath || "Cartella download predefinita"}</code>
          </div>
          <div className="info-row">
            <strong>🔗 Percorso completo:</strong> <code>{getFullFilePath()}</code>
          </div>          <div className="info-row">
            <strong>💾 Storage:</strong> Tutte le operazioni salvate nel file specificato (punto di riferimento unico)
          </div>
        </div>
      </div>      {/* Field Configuration Section */}
      <div className="settings-section">
        <h3>📝 Campi delle Operazioni Configurati</h3>
        <p>Questi sono i campi attualmente configurati per registrare le operazioni:</p>
        
        <div className="fields-actions" style={{ marginBottom: '16px' }}>
          <button 
            onClick={async () => await onTradeFieldsUpdate(defaultTradeFields)}
            className="reset-fields-btn"
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Ripristina Campi di Default
          </button>
          <small style={{ marginLeft: '12px', color: '#666' }}>
            Ripristina tutti i campi inclusi Target Profit, Max Loss e Profit/Loss
          </small>
        </div>
        
        <div className="fields-preview">
          {tradeFields.filter(field => field.enabled).map((field) => (
            <div key={field.id} className="field-preview-card">
              <div className="field-header">
                <span className="field-label">{field.label}</span>
                <span className={`field-badge ${field.required ? 'required' : 'optional'}`}>
                  {field.required ? 'Obbligatorio' : 'Opzionale'}
                </span>
              </div>              <div className="field-details">
                <div className="field-detail">
                  <strong>Tipo:</strong> {
                    field.type === 'text' ? 'Testo' : 
                    field.type === 'number' ? 'Numero' : 
                    field.type === 'date' ? 'Data' : 
                    field.type === 'calculated' ? 'Calcolato' : 
                    'Selezione'
                  }                </div>
                {field.formula && (
                  <div className="field-detail">
                    <strong>Formula:</strong> <code>{field.formula}</code>
                  </div>
                )}
                {field.placeholder && (
                  <div className="field-detail">
                    <strong>Esempio:</strong> {field.placeholder}
                  </div>
                )}
                {field.options && (
                  <div className="field-detail">
                    <strong>Opzioni:</strong> {field.options.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="info-note">
          <strong>ℹ️ Nota:</strong> La configurazione avanzata dei campi è disponibile qui sotto.
        </div>
      </div>      {/* Fields Manager Component */}
      <div className="settings-section fields-section full-width">
        <FieldsManager
          tradeFields={tradeFields}
          onFieldsUpdate={onTradeFieldsUpdate}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
