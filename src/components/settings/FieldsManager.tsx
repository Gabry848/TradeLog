import React, { useState } from 'react';
import { TradeField } from '../../types';

interface FieldsManagerProps {
  tradeFields: TradeField[];
  onFieldsUpdate: (fields: TradeField[]) => void;
}

// Componente OptionsInput separato per evitare ricreazioni
const OptionsInput: React.FC<{ 
  initialOptions?: string[], 
  onChange: (options: string[]) => void 
}> = React.memo(({ initialOptions = [], onChange }) => {
  const [optionsText, setOptionsText] = useState(() => initialOptions.join(', '));

  const handleChange = (value: string) => {
    setOptionsText(value);
    const optionsArray = value.split(',').map(opt => opt.trim()).filter(opt => opt);
    onChange(optionsArray);
  };

  return (
    <div className="form-group">
      <label>Opzioni (separate da virgola)</label>
      <input
        type="text"
        value={optionsText}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Opzione 1, Opzione 2, Opzione 3"
        className="config-input"
      />
      <small>Inserisci le opzioni separate da virgola</small>
    </div>
  );
});

const FieldsManager: React.FC<FieldsManagerProps> = ({ tradeFields, onFieldsUpdate }) => {
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<TradeField | null>(null);
  const [newField, setNewField] = useState<Partial<TradeField>>({
    id: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    enabled: true,
    options: []
  });

  const fieldTypes = [
    { value: 'text', label: '📝 Testo' },
    { value: 'number', label: '🔢 Numero' },
    { value: 'date', label: '📅 Data' },
    { value: 'select', label: '📋 Selezione' }
  ];

  const coreFields = ['id', 'date', 'symbol', 'type', 'qty', 'price', 'pnl', 'fees', 'strategy'];

  const handleAddField = () => {
    if (!newField.id || !newField.label) {
      alert('ID campo e Etichetta sono obbligatori');
      return;
    }

    // Verifica che l'ID non esista già
    if (tradeFields.some(field => field.id === newField.id)) {
      alert('Un campo con questo ID esiste già');
      return;
    }

    const fieldToAdd: TradeField = {
      id: newField.id!,
      label: newField.label!,
      type: newField.type as TradeField['type'] || 'text',
      required: newField.required || false,
      placeholder: newField.placeholder || '',
      enabled: true,
      options: newField.type === 'select' ? newField.options : undefined
    };

    const updatedFields = [...tradeFields, fieldToAdd];
    onFieldsUpdate(updatedFields);
    setNewField({
      id: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      enabled: true,
      options: []
    });
    setIsAddFieldModalOpen(false);
  };

  const handleEditField = (field: TradeField) => {
    setEditingField({ ...field });
  };

  const handleUpdateField = () => {
    if (!editingField) return;

    const updatedFields = tradeFields.map(field =>
      field.id === editingField.id ? editingField : field
    );
    onFieldsUpdate(updatedFields);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (coreFields.includes(fieldId)) {
      alert('Non puoi eliminare i campi essenziali del sistema');
      return;
    }

    if (confirm(`Sei sicuro di voler eliminare il campo "${fieldId}"?`)) {
      const updatedFields = tradeFields.filter(field => field.id !== fieldId);
      onFieldsUpdate(updatedFields);
    }
  };

  const handleToggleField = (fieldId: string) => {
    const updatedFields = tradeFields.map(field =>
      field.id === fieldId ? { ...field, enabled: !field.enabled } : field
    );
    onFieldsUpdate(updatedFields);  };

  const handleOptionsChange = React.useCallback((options: string[], isEditing = false) => {
    const optionsArray = options.filter(opt => opt.trim() !== '');
    
    if (isEditing) {
      setEditingField(prev => prev ? { ...prev, options: optionsArray } : null);
    } else {
      setNewField(prev => ({ ...prev, options: optionsArray }));
    }
  }, []);

  // Callback memoizzati per le opzioni - ora sono completamente stabili
  const handleNewFieldOptionsChange = React.useCallback((options: string[]) => {
    handleOptionsChange(options, false);
  }, [handleOptionsChange]);

  const handleEditFieldOptionsChange = React.useCallback((options: string[]) => {
    handleOptionsChange(options, true);
  }, [handleOptionsChange]);

  return (
    <div className="fields-manager">
      <div className="fields-header">
        <h3>🔧 Gestione Campi Operazioni</h3>
        <button
          onClick={() => setIsAddFieldModalOpen(true)}
          className="add-field-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Aggiungi Campo
        </button>
      </div>

      <div className="fields-description">
        <p>Gestisci i campi che appariranno nel form di inserimento delle operazioni e nella tabella.</p>
      </div>

      {/* Lista Campi Esistenti */}
      <div className="fields-list">
        {tradeFields.map((field) => (
          <div key={field.id} className={`field-card ${!field.enabled ? 'disabled' : ''}`}>
            <div className="field-card-header">
              <div className="field-info">
                <span className="field-label">{field.label}</span>
                <span className="field-id">#{field.id}</span>
              </div>
              <div className="field-badges">
                <span className={`field-type-badge ${field.type}`}>
                  {fieldTypes.find(t => t.value === field.type)?.label}
                </span>
                {field.required && (
                  <span className="required-badge">Obbligatorio</span>
                )}
                {coreFields.includes(field.id) && (
                  <span className="core-badge">Sistema</span>
                )}
              </div>
            </div>

            <div className="field-card-details">
              {field.placeholder && (
                <div className="field-detail">
                  <strong>Placeholder:</strong> {field.placeholder}
                </div>
              )}
              {field.options && field.options.length > 0 && (
                <div className="field-detail">
                  <strong>Opzioni:</strong> {field.options.join(', ')}
                </div>
              )}
            </div>

            <div className="field-card-actions">
              <button
                onClick={() => handleToggleField(field.id)}
                className={`toggle-btn ${field.enabled ? 'enabled' : 'disabled'}`}
                title={field.enabled ? 'Disabilita campo' : 'Abilita campo'}
              >
                {field.enabled ? 'Abilitato' : 'Disabilitato'}
              </button>

              <button
                onClick={() => handleEditField(field)}
                className="edit-btn"
                title="Modifica campo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              {!coreFields.includes(field.id) && (
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="delete-btn"
                  title="Elimina campo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Aggiungi Campo */}
      {isAddFieldModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddFieldModalOpen(false)}>
          <div className="modal-content field-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Aggiungi Nuovo Campo</h3>
              <button onClick={() => setIsAddFieldModalOpen(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form className="field-form" onSubmit={(e) => { e.preventDefault(); handleAddField(); }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="field-id">ID Campo *</label>
                  <input
                    type="text"
                    id="field-id"
                    value={newField.id}
                    onChange={(e) => setNewField({ ...newField, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="es: profit_target"
                    className="config-input"
                    required
                  />
                  <small>Identificatore unico per il campo (lettere, numeri, underscore)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="field-label">Etichetta *</label>
                  <input
                    type="text"
                    id="field-label"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="es: Profit Target"
                    className="config-input"
                    required
                  />
                  <small>Nome che apparirà nell'interfaccia</small>
                </div>

                <div className="form-group">
                  <label htmlFor="field-type">Tipo Campo</label>
                  <select
                    id="field-type"
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as TradeField['type'] })}
                    className="config-input"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="field-placeholder">Placeholder</label>
                  <input
                    type="text"
                    id="field-placeholder"
                    value={newField.placeholder}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="es: Inserisci il target di profitto"
                    className="config-input"
                  />
                  <small>Testo di aiuto che appare nel campo vuoto</small>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    />
                    <span className="checkbox-text">Campo obbligatorio</span>
                  </label>
                </div>
              </div>              {newField.type === 'select' && (
                <OptionsInput
                  initialOptions={newField.options || []}
                  onChange={handleNewFieldOptionsChange}
                />
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setIsAddFieldModalOpen(false)} className="cancel-btn">
                  Annulla
                </button>
                <button type="submit" className="submit-btn">
                  Aggiungi Campo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Campo */}
      {editingField && (
        <div className="modal-overlay" onClick={() => setEditingField(null)}>
          <div className="modal-content field-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Modifica Campo: {editingField.label}</h3>
              <button onClick={() => setEditingField(null)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form className="field-form" onSubmit={(e) => { e.preventDefault(); handleUpdateField(); }}>
              <div className="form-grid">
                <div className="form-group">
                  <label>ID Campo</label>
                  <input
                    type="text"
                    value={editingField.id}
                    className="config-input"
                    disabled
                  />
                  <small>L'ID non può essere modificato</small>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-field-label">Etichetta *</label>
                  <input
                    type="text"
                    id="edit-field-label"
                    value={editingField.label}
                    onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                    className="config-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-field-type">Tipo Campo</label>
                  <select
                    id="edit-field-type"
                    value={editingField.type}
                    onChange={(e) => setEditingField({ ...editingField, type: e.target.value as TradeField['type'] })}
                    className="config-input"
                    disabled={coreFields.includes(editingField.id)}
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {coreFields.includes(editingField.id) && (
                    <small>Il tipo dei campi di sistema non può essere modificato</small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-field-placeholder">Placeholder</label>
                  <input
                    type="text"
                    id="edit-field-placeholder"
                    value={editingField.placeholder}
                    onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                    className="config-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editingField.required}
                      onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                      disabled={coreFields.includes(editingField.id)}
                    />
                    <span className="checkbox-text">Campo obbligatorio</span>
                  </label>
                  {coreFields.includes(editingField.id) && (
                    <small>La proprietà "obbligatorio" dei campi sistema non può essere modificata</small>
                  )}
                </div>
              </div>              {editingField.type === 'select' && (
                <OptionsInput
                  initialOptions={editingField.options || []}
                  onChange={handleEditFieldOptionsChange}
                />
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setEditingField(null)} className="cancel-btn">
                  Annulla
                </button>
                <button type="submit" className="submit-btn">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldsManager;
