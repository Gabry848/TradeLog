import React, { useState, useEffect } from 'react';
import { TradeField, NewTradeData, Trade } from '../../types';
import { calculateAllFields } from '../../utils/calculatedFields';
import TradeJournal from '../journal/TradeJournal';
import '../../styles/modal.css';

interface AddTradeModalProps {
  isOpen: boolean;
  tradeFields: TradeField[];
  onClose: () => void;
  onSubmit: (tradeData: NewTradeData) => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({
  isOpen,
  tradeFields,
  onClose,
  onSubmit,
}) => {  const [formData, setFormData] = useState<Partial<Trade>>({});
  const [calculatedValues, setCalculatedValues] = useState<Record<string, number | string>>({});
  const [preTradeNotes, setPreTradeNotes] = useState<string>('');
  const [postTradeNotes, setPostTradeNotes] = useState<string>('');
  const [mood, setMood] = useState<"confident" | "uncertain" | "fearful" | "greedy" | "neutral" | "disciplined" | undefined>();
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Inizializza i valori predefiniti
  useEffect(() => {
    const initialData: Partial<Trade> = {};
    tradeFields.forEach(field => {
      if (field.defaultValue !== undefined && field.enabled) {
        (initialData as Record<string, unknown>)[field.id] = field.defaultValue;
      }
    });
    setFormData(initialData);
  }, [tradeFields]);

  // Aggiorna i valori calcolati quando i dati del form cambiano
  useEffect(() => {
    const calculated = calculateAllFields(formData, tradeFields);    const calculatedFields = tradeFields
      .filter(field => field.type === 'calculated')
      .reduce((acc, field) => {
        const value = calculated[field.id as keyof Trade];
        if (value !== undefined && value !== null) {
          acc[field.id] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
        }
        return acc;
      }, {} as Record<string, number | string>);
    
    setCalculatedValues(calculatedFields);
  }, [formData, tradeFields]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value === '' ? undefined : (
        tradeFields.find(f => f.id === fieldId)?.type === 'number' 
          ? parseFloat(value) || 0
          : value
      )
    }));
  };

  if (!isOpen) return null;  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formDataObj = new FormData(form);
    
    // Crea l'oggetto trade con tutti i dati del form
    const tradeData: NewTradeData = {
      symbol: formDataObj.get("symbol") as string | null,
      type: formDataObj.get("type") as string | null,
      qty: formDataObj.get("qty") as string | null,
      entryPrice: formDataObj.get("entryPrice") as string | null,
      exitPrice: formDataObj.get("exitPrice") as string | null,
      entryDate: formDataObj.get("entryDate") as string | null,
      exitDate: formDataObj.get("exitDate") as string | null,
      stopLoss: formDataObj.get("stopLoss") as string | null,
      takeProfit: formDataObj.get("takeProfit") as string | null,
      targetProfit: formDataObj.get("targetProfit") as string | null,
      maxLoss: formDataObj.get("maxLoss") as string | null,
      exitReason: formDataObj.get("exitReason") as string | null,
      strategy: formDataObj.get("strategy") as string | null,
      fees: formDataObj.get("fees") as string | null,
      status: formDataObj.get("status") as string | null,
      hitProfitTarget: formDataObj.get("hitProfitTarget") as string | null,
      actualEntryPrice: formDataObj.get("actualEntryPrice") as string | null,
      actualExitPrice: formDataObj.get("actualExitPrice") as string | null,
      // Campi legacy per compatibilità
      price: formDataObj.get("price") as string | null,
      date: formDataObj.get("date") as string | null,
      pnl: formDataObj.get("pnl") as string | null,
    };    // Aggiungi i valori calcolati
    Object.entries(calculatedValues).forEach(([fieldId, value]) => {
      (tradeData as unknown as Record<string, string | number | null>)[fieldId] = String(value);
    });

    // Aggiungi i dati del journal
    const tradeWithJournal = {
      ...tradeData,
      preTradeNotes: preTradeNotes || null,
      postTradeNotes: postTradeNotes || null,
      mood: mood || null,
      screenshots: screenshots.length > 0 ? JSON.stringify(screenshots) : null,
    };

    onSubmit(tradeWithJournal as NewTradeData);
  };
  return (
    <div className="modal-overlay add-trade-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Trade</h3>
          <button onClick={onClose} className="modal-close-btn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="form-grid">            {tradeFields
              .filter((field) => field.enabled)
              .map((field) => (
                <div key={field.id} className="form-group">
                  <label htmlFor={field.id}>
                    {field.label} {field.required && "*"}
                    {field.id === 'pnl' && (
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                        {' '}(Inserire manualmente)
                      </span>
                    )}
                    {field.type === 'calculated' && (
                      <span style={{ fontSize: '12px', color: '#646cff', fontWeight: 'normal' }}>
                        {' '}(Calcolato automaticamente)
                      </span>
                    )}
                  </label>
                  {field.type === 'calculated' ? (
                    <input
                      type="text"
                      value={calculatedValues[field.id] || ''}
                      disabled
                      className="calculated-field"
                      placeholder="Valore calcolato automaticamente"
                    />                  ) : field.type === "select" ? (                    <select
                      id={field.id}
                      name={field.id}
                      required={field.required}
                      value={String(formData[field.id as keyof Trade] || field.defaultValue || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    >
                      <option value="">
                        Select {field.label.toLowerCase()}
                      </option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={String(formData[field.id as keyof Trade] || field.defaultValue || '')}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      {...(field.type === "number"
                        ? {
                            step: field.id === "qty" ? "1" : "0.01",
                            ...(field.id === "qty" || field.id === "entryPrice" || field.id === "exitPrice" || field.id === "stopLoss" || field.id === "takeProfit" || field.id === "targetProfit" || field.id === "fees" || field.id === "actualEntryPrice" || field.id === "actualExitPrice" || field.id === "price"
                              ? { min: "0" }
                              : {}),
                          }
                        : {})}
                    />
                  )}
                </div>
              ))}
          </div>

          <TradeJournal
            preTradeNotes={preTradeNotes}
            postTradeNotes={postTradeNotes}
            mood={mood}
            screenshots={screenshots}
            onPreTradeNotesChange={setPreTradeNotes}
            onPostTradeNotesChange={setPostTradeNotes}
            onMoodChange={setMood}
            onScreenshotsChange={setScreenshots}
            isClosedTrade={formData.status === 'Closed'}
          />

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTradeModal;
