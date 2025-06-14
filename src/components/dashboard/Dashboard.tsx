import React from 'react';
import { Trade } from '../../types';
import { calculateTotalPnL, calculateWinRate } from '../../utils/chartUtils';
import MetricCard from './MetricCard';
import EquityChart from './EquityChart';
import RecentTradesTable from './RecentTradesTable';

interface DashboardProps {
  trades: Trade[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const totalPnL = calculateTotalPnL(trades);
  const winRate = calculateWinRate(trades);

  return (
    <>
      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard title="Total P&L" value={totalPnL} />
        <MetricCard title="Win Rate" value={winRate} isPercentage showChart />
      </div>      {/* Equity Curve */}
      <EquityChart trades={trades} />

      {/* Recent Trades */}
      <RecentTradesTable trades={trades} />
    </>
  );
};

export default Dashboard;
