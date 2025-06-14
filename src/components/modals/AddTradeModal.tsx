import React from 'react';
import { TradeField, NewTradeData } from '../../types';

interface AddTradeModalProps {
  isOpen: boolean;
  tradeFields: TradeField[];
  defaultValues: { [key: string]: string };
  onClose: () => void;
  onSubmit: (tradeData: NewTradeData) => void;
}

const AddTradeModal: React.FC<AddTradeModalProps> = ({
  isOpen,
  tradeFields,
  defaultValues,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const tradeData: NewTradeData = {
      symbol: formData.get("symbol") as string | null,
      type: formData.get("type") as string | null,
      qty: formData.get("qty") as string | null,
      entryPrice: formData.get("entryPrice") as string | null,
      exitPrice: formData.get("exitPrice") as string | null,
      entryDate: formData.get("entryDate") as string | null,
      exitDate: formData.get("exitDate") as string | null,
      stopLoss: formData.get("stopLoss") as string | null,
      takeProfit: formData.get("takeProfit") as string | null,
      exitReason: formData.get("exitReason") as string | null,
      strategy: formData.get("strategy") as string | null,
      fees: formData.get("fees") as string | null,
      status: formData.get("status") as string | null,
      hitProfitTarget: formData.get("hitProfitTarget") as string | null,
      actualEntryPrice: formData.get("actualEntryPrice") as string | null,
      actualExitPrice: formData.get("actualExitPrice") as string | null,
      // Campi legacy per compatibilità
      price: formData.get("price") as string | null,
      date: formData.get("date") as string | null,
      pnl: formData.get("pnl") as string | null,
    };
    
    onSubmit(tradeData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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
          <div className="form-grid">
            {tradeFields
              .filter((field) => field.enabled)
              .map((field) => (
                <div key={field.id} className="form-group">
                  <label htmlFor={field.id}>
                    {field.label} {field.required && "*"}
                  </label>
                  {field.type === "select" ? (
                    <select
                      id={field.id}
                      name={field.id}
                      required={field.required}
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
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      placeholder={field.placeholder}
                      defaultValue={defaultValues[field.id] || ''}
                      required={field.required}
                      {...(field.type === "number"
                        ? {
                            step: field.id === "qty" ? "1" : "0.01",
                            min: "0",
                          }
                        : {})}
                    />
                  )}
                </div>
              ))}
          </div>
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
