import React from 'react';
import { Trade } from '../../types';
import { formatDate, formatPnL } from '../../utils/formatters';

interface RecentTradesTableProps {
  trades: Trade[];
}

const RecentTradesTable: React.FC<RecentTradesTableProps> = ({ trades }) => {
  const recentTrades = trades.slice(0, 5).map((trade) => ({
    ...trade,
    date: formatDate(trade.date),
  }));

  return (
    <div className="trades-section">
      <h3>Recent Trades</h3>
      <div className="trades-table">
        <div className="table-header">
          <div>Date</div>
          <div>Symbol</div>
          <div>Type</div>
          <div>Qty</div>
          <div>Price</div>
          <div>P&L</div>
        </div>
        {recentTrades.map((trade, index) => (
          <div key={index} className="table-row">
            <div>{trade.date}</div>
            <div>{trade.symbol}</div>
            <div>{trade.type}</div>
            <div>{trade.qty}</div>
            <div>{trade.price.toFixed(2)}</div>
            <div className={trade.pnl >= 0 ? "positive" : "negative"}>
              {formatPnL(trade.pnl)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTradesTable;
