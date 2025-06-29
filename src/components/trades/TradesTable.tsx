import React from 'react';
import { Trade, TradeField, SortField, SortDirection, EditingCell, ErrorCell } from '../../types';
import { formatDate, formatCurrency, formatPnL } from '../../utils/formatters';

interface TradesTableProps {
  trades: Trade[];
  tradeFields: TradeField[];
  sortField: SortField;
  sortDirection: SortDirection;
  editingCell: EditingCell | null;
  errorCell: ErrorCell | null;
  onSort: (field: SortField) => void;
  onCellClick: (tradeId: number, fieldId: string) => void;
  onCellChange: (tradeId: number, fieldId: string, newValue: string) => void;
  onCellBlur: () => void;
  onCellKeyDown: (e: React.KeyboardEvent) => void;
}

const TradesTable: React.FC<TradesTableProps> = ({
  trades,
  tradeFields,
  sortField,
  sortDirection,
  editingCell,
  errorCell,
  onSort,
  onCellClick,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
}) => {
  const renderTableHeaders = () => {
    const enabledFields = tradeFields.filter(field => field.enabled);
    
    return (
      <>
        <style>
          {`:root { --column-count: ${enabledFields.length}; }`}
        </style>
        {enabledFields.map(field => (
          <div 
            key={field.id}
            onClick={() => onSort(field.id as SortField)} 
            className="sortable"
          >
            {field.label} {sortField === field.id && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ))}
      </>
    );
  };
  const renderTableRow = (trade: Trade) => {
    return tradeFields
      .filter(field => field.enabled)
      .map(field => {
        const value = trade[field.id] ?? (field.type === 'number' ? 0 : '');
        const isEditing = editingCell?.tradeId === trade.id && editingCell?.fieldId === field.id;
        const hasError = errorCell?.tradeId === trade.id && errorCell?.fieldId === field.id;
          const renderEditableCell = (content: React.ReactNode, fieldId: string) => {
          const isCalculated = field.type === 'calculated';
          
          return (
            <div 
              key={field.id} 
              className={`editable-cell ${isEditing ? 'editing' : ''} ${hasError ? 'error' : ''} ${isCalculated ? 'calculated' : ''}`}
              onClick={() => !isCalculated && onCellClick(trade.id, fieldId)}
              title={isCalculated ? 'Campo calcolato automaticamente' : ''}
            >
              <div className="edit-hint">
                {hasError ? errorCell?.message : (isEditing ? 'Click to edit' : '')}
                {isCalculated && <span className="calculated-indicator">🧮</span>}
              </div>
              {isEditing && !isCalculated ? (
                field.id === 'type' ? (
                  <select
                    className="editable-select"
                    value={String(value)}
                    onChange={(e) => onCellChange(trade.id, fieldId, e.target.value)}
                    onBlur={onCellBlur}
                    onKeyDown={onCellKeyDown}
                    autoFocus
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                ) : field.type === 'select' && field.options ? (
                  <select
                    className="editable-select"
                    value={String(value)}
                    onChange={(e) => onCellChange(trade.id, fieldId, e.target.value)}
                    onBlur={onCellBlur}
                    onKeyDown={onCellKeyDown}
                    autoFocus
                  >
                    <option value="">Select...</option>
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    className="editable-input"
                    value={String(value)}
                    onChange={(e) => onCellChange(trade.id, fieldId, e.target.value)}
                    onBlur={onCellBlur}
                    onKeyDown={onCellKeyDown}
                    autoFocus
                    step={field.type === 'number' ? '0.01' : undefined}
                  />
                )
              ) : (
                content
              )}
            </div>
          );
        };
        
        switch (field.id) {
          case 'id':
            return <div key={field.id} className="id-cell">{value}</div>;
          case 'date':
            return renderEditableCell(formatDate(String(value)), field.id);
          case 'symbol':
            return renderEditableCell(<span className="symbol">{String(value)}</span>, field.id);
          case 'type':
            return renderEditableCell(
              <span className={`trade-type ${String(value).toLowerCase()}`}>
                {String(value)}
              </span>, 
              field.id
            );
          case 'qty':
            return renderEditableCell(Number(value).toLocaleString(), field.id);
          case 'price':
            return renderEditableCell(formatCurrency(Number(value)), field.id);
          case 'fees':
            return renderEditableCell(formatCurrency(Number(value)), field.id);
          case 'pnl': {
            const pnlValue = Number(value);
            return renderEditableCell(
              <span className={pnlValue >= 0 ? "positive" : "negative"}>
                {formatPnL(pnlValue)}
              </span>,
              field.id
            );
          }
          case 'strategy':
            return renderEditableCell(<span className="strategy">{String(value)}</span>, field.id);
          default:
            if (field.type === 'number') {
              return renderEditableCell(Number(value).toFixed(2), field.id);
            }
            return renderEditableCell(String(value), field.id);
        }
      });
  };

  return (
    <div className="trades-table-full">
      <div className="table-header-full">
        {renderTableHeaders()}
      </div>
      {trades.map((trade) => (
        <div key={trade.id} className="table-row-full">
          {renderTableRow(trade)}
        </div>
      ))}
    </div>
  );
};

export default TradesTable;
