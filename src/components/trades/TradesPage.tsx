import React from 'react';
import { Trade, FilterState, SortField, SortDirection, TradeField, EditingCell, ErrorCell } from '../../types';
import TradeFilters from './TradeFilters';
import TradeActions from './TradeActions';
import TradesTable from './TradesTable';

interface TradesPageProps {
  trades: Trade[];
  tradeFields: TradeField[];
  defaultValues: { [key: string]: string };
  filters: FilterState;
  sortField: SortField;
  sortDirection: SortDirection;
  editingCell: EditingCell | null;
  savedCell: EditingCell | null;
  errorCell: ErrorCell | null;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  onSort: (field: SortField) => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onAddTrade: () => void;
  onCellClick: (tradeId: number, fieldId: string) => void;
  onCellChange: (tradeId: number, fieldId: string, newValue: string) => void;
  onCellBlur: () => void;
  onCellKeyDown: (e: React.KeyboardEvent) => void;
}

const TradesPage: React.FC<TradesPageProps> = ({
  trades,
  tradeFields,
  defaultValues,
  filters,
  sortField,
  sortDirection,
  editingCell,
  savedCell,
  errorCell,
  onFilterChange,
  onClearFilters,
  onSort,
  onImport,
  onExport,
  onAddTrade,
  onCellClick,
  onCellChange,
  onCellBlur,
  onCellKeyDown,
}) => {
  return (
    <div className="trades-page">
      {/* Filters Section */}
      <TradeFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
      />

      {/* Trades Table */}
      <div className="trades-section">
        <div className="trades-header">
          <h3>All Trades ({trades.length})</h3>
          <TradeActions
            onImport={onImport}
            onExport={onExport}
            onAddTrade={onAddTrade}
          />
        </div>
        
        <TradesTable
          trades={trades}
          tradeFields={tradeFields}
          defaultValues={defaultValues}
          sortField={sortField}
          sortDirection={sortDirection}
          editingCell={editingCell}
          savedCell={savedCell}
          errorCell={errorCell}
          onSort={onSort}
          onCellClick={onCellClick}
          onCellChange={onCellChange}
          onCellBlur={onCellBlur}
          onCellKeyDown={onCellKeyDown}
        />
      </div>
    </div>
  );
};

export default TradesPage;
