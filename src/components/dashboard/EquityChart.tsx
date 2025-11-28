import React, { useState, useRef } from 'react';
import { Trade } from '../../types';
import { generateEquityCurveData } from '../../utils/chartUtils';
import ChartTooltip from './ChartTooltip';
import '../../styles/tooltip.css';

interface EquityChartProps {
  trades: Trade[];
}

const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const equityData = generateEquityCurveData(trades);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: [] as { label: string; value: string | number; color?: string }[],
    tradeId: undefined as number | undefined,
  });
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Se non ci sono dati, mostra un messaggio
  if (equityData.length === 0) {
    return (
      <div className="equity-section">
        <h3>Equity Curve</h3>
        <div className="equity-chart-large">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#9ca3af',
            fontSize: '1.1rem'
          }}>
            No closed trades available for equity curve
          </div>
        </div>
      </div>
    );
  }
  
  // Calcola i limiti per il grafico
  const values = equityData.map(d => d.value || 0);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 100; // Evita divisione per zero
  
  // Genera i punti SVG
  const svgWidth = 800;
  const svgHeight = 200;
  const padding = 50;
  const chartWidth = svgWidth - 2 * padding;
  const chartHeight = svgHeight - 2 * padding;
  
  const points = equityData.map((point, index) => {
    // Evita divisione per zero quando c'è solo un trade
    const x = equityData.length === 1
      ? padding + chartWidth / 2
      : padding + (index / (equityData.length - 1)) * chartWidth;
    const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Crea i punti per il riempimento dell'area
  const areaPoints = `${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`;
    // Determina il colore basato sull'andamento finale
  const finalValue = values[values.length - 1] || 0;
  const isPositive = finalValue >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  // Trova il trade corrispondente per ogni punto
  const closedTrades = trades.filter(t => t.status === 'Closed').sort(
    (a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime()
  );

  const handlePointHover = (event: React.MouseEvent, point: typeof equityData[0], index: number) => {
    const trade = closedTrades[index];
    if (!trade) return;

    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      data: [
        { label: 'Date', value: trade.exitDate || trade.entryDate },
        { label: 'Symbol', value: trade.symbol },
        { label: 'P&L', value: `$${(trade.pnl || 0).toFixed(2)}`, color: trade.pnl >= 0 ? '#10b981' : '#ef4444' },
        { label: 'Cumulative', value: `$${(point.value || 0).toFixed(2)}`, color: strokeColor },
      ],
      tradeId: trade.id,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const handleTradeClick = (tradeId: number) => {
    // Qui potresti aprire un modal con i dettagli del trade
    console.log('View trade:', tradeId);
    // TODO: Implementare navigazione ai dettagli del trade
  };

  return (
    <div className="equity-section">
      <h3>Equity Curve</h3>
      <div className="equity-chart-large">
        <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-area-interactive">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area riempita */}
          <polygon
            points={areaPoints}
            fill="url(#areaGradient)"
          />
          
          {/* Griglia di background */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * chartHeight / 4)}
              x2={svgWidth - padding}
              y2={padding + (i * chartHeight / 4)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Linea dello zero */}
          {minValue < 0 && maxValue > 0 && (
            <line
              x1={padding}
              y1={padding + chartHeight - ((0 - minValue) / range) * chartHeight}
              x2={svgWidth - padding}
              y2={padding + chartHeight - ((0 - minValue) / range) * chartHeight}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
          
          {/* Linea principale dell'equity */}
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Punti sulla linea */}
          {equityData.map((point, index) => {
            // Evita divisione per zero quando c'è solo un trade
            const x = equityData.length === 1
              ? padding + chartWidth / 2
              : padding + (index / (equityData.length - 1)) * chartWidth;
            const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill={strokeColor}
                opacity="0.8"
                className="chart-point-interactive"
                onMouseEnter={(e) => handlePointHover(e, point, index)}
                onMouseMove={(e) => handlePointHover(e, point, index)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>
        
        {/* Informazioni aggiuntive */}
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#f3f4f6'
        }}>
          <div>Total P&L: <span style={{ color: strokeColor, fontWeight: 'bold' }}>
            ${finalValue.toFixed(2)}
          </span></div>
          <div>Trades: {equityData.length}</div>
        </div>

        <ChartTooltip
          x={tooltip.x}
          y={tooltip.y}
          visible={tooltip.visible}
          data={tooltip.data}
          tradeId={tooltip.tradeId}
          onTradeClick={handleTradeClick}
        />
      </div>
    </div>
  );
};

export default EquityChart;
