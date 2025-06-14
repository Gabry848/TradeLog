import React from 'react';
import { TradeField, DefaultValues } from '../../types';
import FieldsManager from './FieldsManager';

interface SettingsPageProps {
  filePath: string;
  destinationPath: string;
  defaultValues: DefaultValues;
  tradeFields: TradeField[];
  onFilePathChange: (path: string) => void;
  onDestinationPathChange: (path: string) => void;
  onDefaultValuesChange: (values: DefaultValues) => void;
  onTradeFieldsUpdate: (fields: TradeField[]) => void;
  onSelectDestinationFolder: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  filePath,
  destinationPath,
  defaultValues,
  tradeFields,
  onFilePathChange,
  onDestinationPathChange,
  onDefaultValuesChange,
  onTradeFieldsUpdate,
  onSelectDestinationFolder,
}) => {
  const getFullFilePath = () => {
    if (!destinationPath) return filePath;
    const separator = destinationPath.includes("/") ? "/" : "\\";
    const cleanDestination = destinationPath.endsWith("/") || destinationPath.endsWith("\\")
      ? destinationPath.slice(0, -1)
      : destinationPath;
    return `${cleanDestination}${separator}${filePath}`;
  };

  const handleDefaultValueChange = (fieldId: string, value: string) => {
    const newDefaults = { ...defaultValues, [fieldId]: value };
    onDefaultValuesChange(newDefaults);
  };

  return (
    <div className="settings-page">
      {/* File Configuration Section */}
      <div className="settings-section">
        <h3>📁 Configurazione File di Salvataggio</h3>
        <p>Imposta dove salvare le tue operazioni di trading.</p>        <div className="help-box">
          <h4>💡 Come funziona:</h4>
          <ul>
            <li><strong>File Unico:</strong> Tutte le operazioni vengono salvate SOLO nel file specificato</li>
            <li><strong>Inizio Pulito:</strong> L'applicazione inizia sempre vuota, senza operazioni demo</li>
            <li><strong>Auto-save:</strong> Ogni operazione viene salvata automaticamente nel file</li>
            <li><strong>Import CSV:</strong> Importa operazioni da file esterni (sostituisce i dati attuali)</li>
            <li><strong>Export CSV:</strong> Crea una copia del file in un'altra posizione</li>
            <li><strong>Browser Web:</strong> Download nella cartella predefinita</li>
            <li><strong>App Electron:</strong> Salvataggio diretto nella cartella specificata</li>
          </ul>
        </div>

        <div className="file-config-grid">
          <div className="form-group">
            <label htmlFor="file-path">📄 Nome File CSV</label>
            <input
              type="text"
              id="file-path"
              value={filePath}
              onChange={(e) => {
                let newPath = e.target.value;
                if (newPath && !newPath.toLowerCase().endsWith(".csv")) {
                  newPath = newPath.replace(/\.[^/.]+$/, "") + ".csv";
                }
                onFilePathChange(newPath);
              }}
              placeholder="es: le_mie_operazioni.csv"
              className="config-input"
            />
            <small>Nome del file CSV dove salvare le operazioni</small>
          </div>

          <div className="form-group">
            <label htmlFor="destination-path">📂 Cartella di Destinazione</label>
            <div className="destination-input-group">
              <input
                type="text"
                id="destination-path"
                value={destinationPath}
                onChange={(e) => onDestinationPathChange(e.target.value)}
                placeholder="es: C:\Users\Nome\Documents\Trading"
                className="config-input"
              />
              <button
                onClick={onSelectDestinationFolder}
                className="browse-btn"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                Sfoglia
              </button>
            </div>
            <small>Cartella dove salvare i file CSV</small>
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
      </div>

      {/* Default Values Section */}
      <div className="settings-section">
        <h3>⚙️ Valori Predefiniti per Nuove Operazioni</h3>
        <p>Imposta i valori che verranno utilizzati di default quando aggiungi una nuova operazione.</p>
        
        <div className="info-note" style={{ backgroundColor: '#e3f2fd', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #90caf9' }}>
          <strong>📋 Importante:</strong> Il P&L deve ora essere inserito manualmente per ogni operazione. Non viene più calcolato automaticamente dal sistema.
        </div>

        <div className="defaults-grid">
          <div className="form-group">
            <label htmlFor="default-pnl">💰 P&L Predefinito</label>
            <input
              type="number"
              id="default-pnl"
              value={defaultValues.pnl || '0'}
              onChange={(e) => handleDefaultValueChange('pnl', e.target.value)}
              step="0.01"
              placeholder="0.00"
              className="config-input"
            />
            <small>Valore di profitto/perdita di default (da impostare manualmente)</small>
          </div>

          <div className="form-group">
            <label htmlFor="default-qty">📊 Quantità Predefinita</label>
            <input
              type="number"
              id="default-qty"
              value={defaultValues.qty || '1'}
              onChange={(e) => handleDefaultValueChange('qty', e.target.value)}
              min="1"
              placeholder="1"
              className="config-input"
            />
            <small>Numero di azioni/contratti di default</small>
          </div>

          <div className="form-group">
            <label htmlFor="default-price">💵 Prezzo Predefinito</label>
            <input
              type="number"
              id="default-price"
              value={defaultValues.price || '100'}
              onChange={(e) => handleDefaultValueChange('price', e.target.value)}
              step="0.01"
              min="0"
              placeholder="100.00"
              className="config-input"
            />
            <small>Prezzo per azione di default</small>
          </div>

          <div className="form-group">
            <label htmlFor="default-fees">🏷️ Commissioni Predefinite</label>
            <input
              type="number"
              id="default-fees"
              value={defaultValues.fees || '1'}
              onChange={(e) => handleDefaultValueChange('fees', e.target.value)}
              step="0.01"
              min="0"
              placeholder="1.00"
              className="config-input"
            />
            <small>Commissioni del broker di default</small>
          </div>
        </div>
      </div>

      {/* Field Configuration Section */}
      <div className="settings-section">
        <h3>📝 Campi delle Operazioni Configurati</h3>
        <p>Questi sono i campi attualmente configurati per registrare le operazioni:</p>
        
        <div className="fields-preview">
          {tradeFields.filter(field => field.enabled).map((field) => (
            <div key={field.id} className="field-preview-card">
              <div className="field-header">
                <span className="field-label">{field.label}</span>
                <span className={`field-badge ${field.required ? 'required' : 'optional'}`}>
                  {field.required ? 'Obbligatorio' : 'Opzionale'}
                </span>
              </div>
              <div className="field-details">
                <div className="field-detail">
                  <strong>Tipo:</strong> {field.type === 'text' ? 'Testo' : field.type === 'number' ? 'Numero' : field.type === 'date' ? 'Data' : 'Selezione'}
                </div>
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
      </div>

      {/* Fields Manager Component */}
      <FieldsManager
        tradeFields={tradeFields}
        onFieldsUpdate={onTradeFieldsUpdate}
      />
    </div>
  );
};

export default SettingsPage;
