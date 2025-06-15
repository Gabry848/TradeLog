import React, { useState, useEffect } from 'react';
import { TradeField } from '../../types';
import { validateFormula, extractDependencies, PREDEFINED_FORMULAS } from '../../utils/calculatedFields';

interface CalculatedFieldEditorProps {
  field: Partial<TradeField>;
  onFieldChange: (field: Partial<TradeField>) => void;
  availableFields: TradeField[];
}

const CalculatedFieldEditor: React.FC<CalculatedFieldEditorProps> = ({
  field,
  onFieldChange,
  availableFields
}) => {  const [formulaError, setFormulaError] = useState<string>('');
  const [showPredefined, setShowPredefined] = useState(false);
  const [highlightedFormula, setHighlightedFormula] = useState<string>('');

  // Campi disponibili per le dipendenze (tutti i tipi tranne calculated)
  const selectableFields = availableFields.filter(f => 
    f.type !== 'calculated' && f.enabled
  );
  useEffect(() => {
    if (field.formula) {
      const validation = validateFormula(field.formula, availableFields);
      if (!validation.valid) {
        setFormulaError(validation.error || 'Errore sconosciuto');
      } else {
        setFormulaError('');
        // Aggiorna automaticamente le dipendenze
        const dependencies = extractDependencies(field.formula);
        const currentDepsString = JSON.stringify(field.dependencies || []);
        const newDepsString = JSON.stringify(dependencies);
        
        if (currentDepsString !== newDepsString) {
          onFieldChange({ ...field, dependencies });
        }
      }
    }
  }, [field.formula, field.dependencies, availableFields, onFieldChange, field]);

  const handleFormulaChange = (formula: string) => {
    onFieldChange({ ...field, formula });
  };

  const handleDefaultValueChange = (value: string) => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    onFieldChange({ ...field, defaultValue: isNaN(numericValue!) ? value : numericValue });
  };
  const insertPredefinedFormula = (formulaKey: string) => {
    const predefined = PREDEFINED_FORMULAS[formulaKey as keyof typeof PREDEFINED_FORMULAS];
    if (predefined) {
      handleFormulaChange(predefined.formula);
      
      // Evidenzia brevemente la formula inserita
      setHighlightedFormula(formulaKey);
      setTimeout(() => setHighlightedFormula(''), 2000);
      
      setShowPredefined(false);
    }
  };

  const insertFieldReference = (fieldId: string) => {
    const currentFormula = field.formula || '';
    const newFormula = currentFormula + `{${fieldId}}`;
    handleFormulaChange(newFormula);
  };

  return (
    <div className="calculated-field-editor">
      <div className="form-group">
        <label htmlFor="default-value">Valore Predefinito</label>
        <input
          type="number"
          id="default-value"
          value={field.defaultValue || ''}
          onChange={(e) => handleDefaultValueChange(e.target.value)}
          placeholder="Valore predefinito per il campo"
          className="config-input"
          step="0.01"
        />
        <small>Valore utilizzato quando il campo è vuoto</small>
      </div>

      <div className="form-group">
        <label htmlFor="formula">Formula di Calcolo</label>        <div className="formula-editor">
          <textarea
            id="formula"
            value={field.formula || ''}
            onChange={(e) => handleFormulaChange(e.target.value)}
            placeholder="Inserisci la formula, es: {capitale_totale} / 100 * {size}"
            className={`config-input formula-textarea ${formulaError ? 'error' : ''}`}
            rows={3}
          />
          <div className="formula-helpers">
            <button
              type="button"
              onClick={() => setShowPredefined(!showPredefined)}
              className="helper-btn"
            >
              📐 Formule Predefinite
            </button>
            
            <div className="field-selector">
              <label className="helper-label">Inserisci Campo:</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    insertFieldReference(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="field-selector-dropdown"
              >
                <option value="">Seleziona un campo...</option>
                {selectableFields.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.id}) - {f.type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {formulaError && (
          <div className="formula-error">
            ❌ {formulaError}
          </div>
        )}
        
        <div className="formula-help">
          <small>
            <strong>Sintassi:</strong> Usa {`{campo_id}`} per riferimenti ai campi. 
            Operatori supportati: +, -, *, /, (), Math.round(), Math.floor(), Math.ceil()
          </small>
        </div>
      </div>      {showPredefined && (
        <div className="predefined-formulas">
          <h4>Formule Predefinite</h4>
          {(() => {
            // Raggruppa le formule per categoria
            const categorizedFormulas = Object.entries(PREDEFINED_FORMULAS).reduce((acc, [key, formula]) => {
              const category = formula.category || 'Generale';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push([key, formula]);
              return acc;
            }, {} as Record<string, Array<[string, typeof PREDEFINED_FORMULAS[keyof typeof PREDEFINED_FORMULAS]]>>);

            return Object.entries(categorizedFormulas).map(([category, formulas]) => (
              <div key={category} className="formula-category">
                <div className="category-title">
                  {category === 'Gestione Capitale' && '💰'}
                  {category === 'Analisi Rischio' && '⚠️'}
                  {category === 'Performance' && '📈'}
                  {category === 'Metriche Avanzate' && '🧮'}
                  {category === 'Generale' && '📊'}
                  {category}
                </div>
                <div className="category-formulas">                  {formulas.map(([key, formula]) => (
                    <div key={key} className={`predefined-formula ${highlightedFormula === key ? 'highlighted' : ''}`}>
                      <div className="formula-info">
                        <strong>{formula.name}</strong>
                        <p>{formula.description}</p>
                        <code>{formula.formula}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => insertPredefinedFormula(key)}
                        className="use-formula-btn"
                      >
                        Usa Formula
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {field.dependencies && field.dependencies.length > 0 && (
        <div className="dependencies-info">
          <strong>Dipendenze:</strong>
          <div className="dependencies-list">
            {field.dependencies.map(dep => {
              const depField = availableFields.find(f => f.id === dep);
              return (
                <span 
                  key={dep} 
                  className={`dependency-badge ${depField ? 'valid' : 'invalid'}`}
                >
                  {dep} {depField ? `(${depField.label})` : '(non trovato)'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatedFieldEditor;
