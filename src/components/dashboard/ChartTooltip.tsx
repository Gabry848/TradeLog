import React from 'react';
import '../../styles/tooltip.css';

interface ChartTooltipProps {
  x: number;
  y: number;
  visible: boolean;
  data: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  tradeId?: number;
  onTradeClick?: (tradeId: number) => void;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({
  x,
  y,
  visible,
  data,
  tradeId,
  onTradeClick
}) => {
  if (!visible) return null;

  // Calcola la posizione del tooltip per evitare che esca dallo schermo
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${x + 10}px`,
    top: `${y - 10}px`,
    transform: x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none',
  };

  return (
    <div className="chart-tooltip" style={tooltipStyle}>
      <div className="tooltip-content">
        {data.map((item, index) => (
          <div key={index} className="tooltip-item">
            {item.color && (
              <span
                className="tooltip-color"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="tooltip-label">{item.label}:</span>
            <span className="tooltip-value">{item.value}</span>
          </div>
        ))}
        {tradeId && onTradeClick && (
          <button
            className="tooltip-view-trade"
            onClick={() => onTradeClick(tradeId)}
          >
            View Trade Details →
          </button>
        )}
      </div>
    </div>
  );
};

export default ChartTooltip;
