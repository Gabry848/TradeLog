import React from 'react';
import { FilterState } from '../../types';

interface TradeFiltersProps {
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
}

const TradeFilters: React.FC<TradeFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="filters-section">
      <h3>Filters</h3>
      <div className="filters-grid">
        <div className="filter-group">
          <label>Symbol</label>
          <input
            type="text"
            placeholder="e.g. AAPL"
            value={filters.symbol}
            onChange={(e) => onFilterChange("symbol", e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
          >
            <option value="">All</option>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Strategy</label>
          <input
            type="text"
            placeholder="e.g. Momentum"
            value={filters.strategy}
            onChange={(e) => onFilterChange("strategy", e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Min P&L</label>
          <input
            type="number"
            placeholder="-1000"
            value={filters.minPnL}
            onChange={(e) => onFilterChange("minPnL", e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Max P&L</label>
          <input
            type="number"
            placeholder="1000"
            value={filters.maxPnL}
            onChange={(e) => onFilterChange("maxPnL", e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button onClick={onClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeFilters;
