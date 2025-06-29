import React, { useState, useEffect, useRef } from 'react';
import { TradeField } from '../../types';
import CalculatedFieldEditor from './CalculatedFieldEditor';
import { addExampleFields } from '../../data/exampleFields';

interface FieldsManagerProps {
  tradeFields: TradeField[];
  onFieldsUpdate: (fields: TradeField[]) => Promise<void>;
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
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; fieldId: string; fieldLabel: string }>({
    isOpen: false,
    fieldId: '',
    fieldLabel: ''
  });
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Chiude il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(event.target as Node)) {
        setShowQuickAddMenu(false);
      }
    };

    if (showQuickAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickAddMenu]);

  const [newField, setNewField] = useState<Partial<TradeField>>({
    id: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    enabled: true,
    options: [],
    formula: '',
    dependencies: [],
    defaultValue: undefined
  });
  const fieldTypes = [
    { value: 'text', label: '📝 Testo' },
    { value: 'number', label: '🔢 Numero' },
    { value: 'date', label: '📅 Data' },
    { value: 'select', label: '📋 Selezione' },
    { value: 'calculated', label: '🧮 Calcolato' }
  ];
  const coreFields = ['id', 'date', 'symbol', 'type', 'qty', 'price', 'pnl', 'fees', 'strategy'];

  // Filtra i campi in base alla ricerca
  const filteredFields = tradeFields.filter(field => {
    const query = searchQuery.toLowerCase();
    return (
      field.label.toLowerCase().includes(query) ||
      field.id.toLowerCase().includes(query) ||
      field.type.toLowerCase().includes(query) ||
      (field.formula && field.formula.toLowerCase().includes(query))
    );
  });

  const handleAddField = async () => {
    if (!newField.id || !newField.label) {
      alert('ID campo e Etichetta sono obbligatori');
      return;
    }

    // Verifica che l'ID non esista già
    if (tradeFields.some(field => field.id === newField.id)) {
      alert('Un campo con questo ID esiste già');
      return;
    }    const fieldToAdd: TradeField = {
      id: newField.id!,
      label: newField.label!,
      type: newField.type as TradeField['type'] || 'text',
      required: newField.required || false,
      placeholder: newField.placeholder || '',
      enabled: true,
      options: newField.type === 'select' ? newField.options : undefined,
      formula: newField.type === 'calculated' ? newField.formula : undefined,
      dependencies: newField.type === 'calculated' ? newField.dependencies : undefined,
      defaultValue: newField.defaultValue
    };    const updatedFields = [...tradeFields, fieldToAdd];
    await onFieldsUpdate(updatedFields);setNewField({
      id: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      enabled: true,
      options: [],
      formula: '',
      dependencies: [],
      defaultValue: undefined
    });
    setIsAddFieldModalOpen(false);
  };

  const handleEditField = (field: TradeField) => {
    setEditingField({ ...field });
  };
  const handleUpdateField = async () => {
    if (!editingField) return;

    const updatedFields = tradeFields.map(field =>
      field.id === editingField.id ? editingField : field
    );
    await onFieldsUpdate(updatedFields);
    setEditingField(null);
  };
  const handleDeleteField = (fieldId: string) => {
    if (coreFields.includes(fieldId)) {
      alert('Non puoi eliminare i campi essenziali del sistema');
      return;
    }

    const field = tradeFields.find(f => f.id === fieldId);
    if (field) {
      setDeleteConfirmModal({
        isOpen: true,
        fieldId: fieldId,
        fieldLabel: field.label
      });
    }
  };
  const confirmDeleteField = async () => {
    const updatedFields = tradeFields.filter(field => field.id !== deleteConfirmModal.fieldId);
    await onFieldsUpdate(updatedFields);
    setDeleteConfirmModal({ isOpen: false, fieldId: '', fieldLabel: '' });
  };

  const cancelDeleteField = () => {
    setDeleteConfirmModal({ isOpen: false, fieldId: '', fieldLabel: '' });
  };
  const handleToggleField = async (fieldId: string) => {
    const updatedFields = tradeFields.map(field =>
      field.id === fieldId ? { ...field, enabled: !field.enabled } : field
    );
    await onFieldsUpdate(updatedFields);
  };

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

  const handleEditingFieldChange = React.useCallback((field: Partial<TradeField>) => {
    if (editingField) {
      setEditingField({ ...editingField, ...field });
    }
  }, [editingField]);

  return (
    <div className="fields-manager">      <div className="fields-header">
        <h3>🔧 Gestione Campi Operazioni</h3>
        <div className="fields-actions">          <div className="quick-add-dropdown" ref={quickAddRef}>
            <button 
              className="quick-add-btn"
              onClick={() => setShowQuickAddMenu(!showQuickAddMenu)}
            >
              ⚡ Aggiungi Rapidi
            </button>
            {showQuickAddMenu && (
              <div className="quick-add-menu">                <button
                  onClick={async () => {
                    const updatedFields = addExampleFields(tradeFields, 'calculated');
                    await onFieldsUpdate(updatedFields);
                    setShowQuickAddMenu(false);
                  }}
                  className="quick-add-option"
                >
                  🧮 Campi Calcolati Base
                </button><button
                  onClick={async () => {
                    const updatedFields = addExampleFields(tradeFields, 'portfolio');
                    await onFieldsUpdate(updatedFields);
                    setShowQuickAddMenu(false);
                  }}
                  className="quick-add-option"
                >
                  📊 Analisi Portafoglio
                </button>
                <button
                  onClick={async () => {
                    const updatedFields = addExampleFields(tradeFields, 'risk');
                    await onFieldsUpdate(updatedFields);
                    setShowQuickAddMenu(false);
                  }}
                  className="quick-add-option"
                >
                  ⚠️ Gestione Rischio
                </button>
              </div>
            )}
          </div>
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
      </div>      <div className="fields-description">
        <p>Gestisci i campi che appariranno nel form di inserimento delle operazioni e nella tabella.</p>
      </div>

      <div className="fields-search-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Cerca campi per nome, ID, tipo o formula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="search-clear"
                title="Cancella ricerca"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {searchQuery && (
          <div className="search-results-info">
            <span>Trovati {filteredFields.length} campi su {tradeFields.length}</span>
            {filteredFields.length === 0 && (
              <span className="no-results">Nessun campo corrisponde alla ricerca</span>
            )}
          </div>
        )}
      </div>

      {/* Lista Campi Esistenti */}      <div className="fields-list">
        {filteredFields.map((field) => (
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
            </div>            <div className="field-card-details">
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
              {field.type === 'calculated' && field.formula && (
                <div className="field-detail">
                  <strong>Formula:</strong> <code>{field.formula}</code>
                </div>
              )}
              {field.type === 'calculated' && field.dependencies && field.dependencies.length > 0 && (
                <div className="field-detail">
                  <strong>Dipende da:</strong> {field.dependencies.join(', ')}
                </div>
              )}
              {field.defaultValue !== undefined && (
                <div className="field-detail">
                  <strong>Valore predefinito:</strong> {field.defaultValue}
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
                </div>                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    />
                    <span className="checkbox-text">Campo obbligatorio</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="field-default-value">Valore Predefinito</label>
                  {newField.type === 'select' && newField.options ? (
                    <select
                      id="field-default-value"
                      value={newField.defaultValue || ''}
                      onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                      className="config-input"
                    >
                      <option value="">Nessun valore predefinito</option>
                      {newField.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : newField.type === 'number' ? (
                    <input
                      type="number"
                      id="field-default-value"
                      value={newField.defaultValue || ''}
                      onChange={(e) => setNewField({ ...newField, defaultValue: parseFloat(e.target.value) || undefined })}
                      placeholder="es: 100"
                      className="config-input"
                      step="0.01"
                    />
                  ) : newField.type === 'date' ? (
                    <input
                      type="date"
                      id="field-default-value"
                      value={newField.defaultValue || ''}
                      onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                      className="config-input"
                    />
                  ) : newField.type !== 'calculated' ? (
                    <input
                      type="text"
                      id="field-default-value"
                      value={newField.defaultValue || ''}
                      onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
                      placeholder="es: Valore iniziale"
                      className="config-input"
                    />
                  ) : null}
                  <small>Valore utilizzato quando il campo è vuoto o per nuovi trade</small>
                </div>              </div>

              {newField.type === 'select' && (
                <div className="form-group full-width">
                  <OptionsInput
                    initialOptions={newField.options || []}
                    onChange={handleNewFieldOptionsChange}
                  />
                </div>
              )}              {newField.type === 'calculated' && (
                <div className="form-group full-width">
                  <CalculatedFieldEditor
                    field={newField}
                    onFieldChange={setNewField}
                    availableFields={tradeFields}
                  />
                </div>
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
                </div>                <div className="form-group checkbox-group">
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

                <div className="form-group">
                  <label htmlFor="edit-field-default-value">Valore Predefinito</label>
                  {editingField.type === 'select' && editingField.options ? (
                    <select
                      id="edit-field-default-value"
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                      className="config-input"
                    >
                      <option value="">Nessun valore predefinito</option>
                      {editingField.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : editingField.type === 'number' ? (
                    <input
                      type="number"
                      id="edit-field-default-value"
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({ ...editingField, defaultValue: parseFloat(e.target.value) || undefined })}
                      placeholder="es: 100"
                      className="config-input"
                      step="0.01"
                    />
                  ) : editingField.type === 'date' ? (
                    <input
                      type="date"
                      id="edit-field-default-value"
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                      className="config-input"
                    />
                  ) : editingField.type !== 'calculated' ? (
                    <input
                      type="text"
                      id="edit-field-default-value"
                      value={editingField.defaultValue || ''}
                      onChange={(e) => setEditingField({ ...editingField, defaultValue: e.target.value })}
                      placeholder="es: Valore iniziale"
                      className="config-input"
                    />
                  ) : null}
                  <small>Valore utilizzato quando il campo è vuoto o per nuovi trade</small>
                </div>
              </div>{editingField.type === 'select' && (
                <OptionsInput
                  initialOptions={editingField.options || []}
                  onChange={handleEditFieldOptionsChange}
                />
              )}              {editingField.type === 'calculated' && (
                <CalculatedFieldEditor
                  field={editingField}
                  onFieldChange={handleEditingFieldChange}
                  availableFields={tradeFields}
                />
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setEditingField(null)} className="cancel-btn">
                  Annulla
                </button>
                <button type="submit" className="submit-btn">
                  Salva Modifiche
                </button>
              </div>            </form>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {deleteConfirmModal.isOpen && (
        <div className="modal-overlay" onClick={cancelDeleteField}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Elimina Campo</h3>
              <button onClick={cancelDeleteField} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                </div>
                <div className="warning-content">
                  <h4>Sei sicuro di voler eliminare questo campo?</h4>
                  <p>
                    <strong>Campo:</strong> {deleteConfirmModal.fieldLabel} 
                    <span className="field-id">({deleteConfirmModal.fieldId})</span>
                  </p>
                  <div className="warning-message">
                    <p>⚠️ <strong>Attenzione:</strong> Questa azione eliminerà permanentemente:</p>
                    <ul>
                      <li>Il campo dalla configurazione</li>
                      <li>Tutti i dati associati nelle operazioni esistenti</li>
                      <li>Eventuali formule che dipendono da questo campo</li>
                    </ul>
                    <p className="irreversible">❌ <strong>Questa operazione non può essere annullata!</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={cancelDeleteField} className="modal-btn secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
                Annulla
              </button>
              <button onClick={confirmDeleteField} className="modal-btn danger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                </svg>
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldsManager;
