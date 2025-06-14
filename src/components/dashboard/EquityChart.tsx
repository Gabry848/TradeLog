import React from 'react';
import { Trade } from '../../types';
import { generateEquityCurveData } from '../../utils/chartUtils';

interface EquityChartProps {
  trades: Trade[];
}

const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const equityData = generateEquityCurveData(trades);
  
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
    const x = padding + (index / (equityData.length - 1)) * chartWidth;
    const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Crea i punti per il riempimento dell'area
  const areaPoints = `${padding},${svgHeight - padding} ${points} ${svgWidth - padding},${svgHeight - padding}`;
    // Determina il colore basato sull'andamento finale
  const finalValue = values[values.length - 1] || 0;
  const isPositive = finalValue >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="equity-section">
      <h3>Equity Curve</h3>
      <div className="equity-chart-large">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
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
            const x = padding + (index / (equityData.length - 1)) * chartWidth;
            const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={strokeColor}
                opacity="0.8"
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
      </div>
    </div>
  );
};

export default EquityChart;
