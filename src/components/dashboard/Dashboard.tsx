import React from 'react';
import { Trade } from '../../types';
import { calculateTotalPnL } from '../../utils/chartUtils';
import MetricCard from './MetricCard';
import WinRateCard from './WinRateCard';
import EquityChart from './EquityChart';
import RecentTradesTable from './RecentTradesTable';

interface DashboardProps {
  trades: Trade[];
}

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const totalPnL = calculateTotalPnL(trades);
  return (
    <div className="dashboard-page">
      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard title="Total P&L" value={totalPnL} />
        <WinRateCard trades={trades} />
      </div>

      {/* Equity Curve */}
      <EquityChart trades={trades} />

      {/* Recent Trades */}
      <RecentTradesTable trades={trades} />
    </div>
  );
};

export default Dashboard;
