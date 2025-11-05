import React, { useMemo, useState } from 'react';
import { Trade } from '../../types';
import { generateEquityCurveData } from '../../utils/chartUtils';

interface EquityChartProps {
  trades: Trade[];
}

interface TooltipData {
  x: number;
  y: number;
  value: number;
  date: string;
  index: number;
}

const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoize equity data calculation
  const equityData = useMemo(() => generateEquityCurveData(trades), [trades]);

  // Memoize chart dimensions and calculations
  const chartConfig = useMemo(() => {
    if (equityData.length === 0) return null;

    const svgWidth = 800;
    const svgHeight = 200;
    const padding = 50;
    const chartWidth = svgWidth - 2 * padding;
    const chartHeight = svgHeight - 2 * padding;

    const values = equityData.map(d => d.value || 0);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(0, ...values);
    const range = maxValue - minValue || 100;

    return {
      svgWidth,
      svgHeight,
      padding,
      chartWidth,
      chartHeight,
      minValue,
      maxValue,
      range,
      values,
    };
  }, [equityData]);

  // Memoize SVG points
  const chartPoints = useMemo(() => {
    if (!chartConfig) return null;

    const { padding, chartWidth, chartHeight, minValue, range } = chartConfig;

    const points = equityData.map((point, index) => {
      const x = padding + (index / (equityData.length - 1)) * chartWidth;
      const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
      return { x, y, value: point.value || 0, date: point.date || '' };
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${padding},${chartConfig.svgHeight - padding} ${pointsString} ${chartConfig.svgWidth - padding},${chartConfig.svgHeight - padding}`;

    return { points, pointsString, areaPoints };
  }, [equityData, chartConfig]);

  // Handle mouse move for tooltip
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!chartConfig || !chartPoints) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    // Find closest point
    let closestIndex = 0;
    let minDistance = Infinity;

    chartPoints.points.forEach((point, index) => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    // Only show tooltip if close enough (within 30px)
    if (minDistance < 30) {
      const point = chartPoints.points[closestIndex];
      setTooltip({
        x: point.x,
        y: point.y,
        value: point.value,
        date: point.date,
        index: closestIndex,
      });
      setHoveredIndex(closestIndex);
    } else {
      setTooltip(null);
      setHoveredIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredIndex(null);
  };

  // Se non ci sono dati, mostra un messaggio
  if (equityData.length === 0) {
    return (
      <div className="equity-section">
        <h3>Equity Curve</h3>
        <div className="equity-chart-large">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              fontSize: '1.1rem',
            }}
          >
            No closed trades available for equity curve
          </div>
        </div>
      </div>
    );
  }

  if (!chartConfig || !chartPoints) return null;

  const { svgWidth, svgHeight, padding, chartWidth, chartHeight, minValue, maxValue, range, values } = chartConfig;
  const finalValue = values[values.length - 1] || 0;
  const isPositive = finalValue >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="equity-section">
      <h3>Equity Curve</h3>
      <div className="equity-chart-large">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair' }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Area riempita */}
          <polygon points={chartPoints.areaPoints} fill="url(#areaGradient)" />

          {/* Griglia di background */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i * chartHeight) / 4}
              x2={svgWidth - padding}
              y2={padding + (i * chartHeight) / 4}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[...Array(5)].map((_, i) => {
            const value = maxValue - (i * range) / 4;
            const y = padding + (i * chartHeight) / 4;
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="rgba(255,255,255,0.6)"
              >
                ${value.toFixed(0)}
              </text>
            );
          })}

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
            points={chartPoints.pointsString}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: 'stroke 0.3s ease',
            }}
          />

          {/* Punti sulla linea */}
          {chartPoints.points.map((point, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={isHovered ? 6 : 3}
                fill={strokeColor}
                opacity={isHovered ? 1 : 0.8}
                style={{
                  transition: 'all 0.2s ease',
                  filter: isHovered ? 'url(#glow)' : 'none',
                }}
              />
            );
          })}

          {/* Tooltip line */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x}
                y1={padding}
                x2={tooltip.x}
                y2={svgHeight - padding}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <line
                x1={padding}
                y1={tooltip.y}
                x2={svgWidth - padding}
                y2={tooltip.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            </>
          )}
        </svg>

        {/* Tooltip info box */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: `${(tooltip.x / svgWidth) * 100}%`,
              top: `${(tooltip.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -120%)',
              background: 'rgba(0, 0, 0, 0.9)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#f3f4f6',
              pointerEvents: 'none',
              border: `2px solid ${strokeColor}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              {tooltip.date}
            </div>
            <div style={{ fontWeight: 'bold', color: strokeColor, fontSize: '1.1rem' }}>
              ${tooltip.value.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Trade #{tooltip.index + 1}
            </div>
          </div>
        )}

        {/* Informazioni aggiuntive */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#f3f4f6',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: '#9ca3af' }}>Total P&L: </span>
            <span style={{ color: strokeColor, fontWeight: 'bold', fontSize: '1.1rem' }}>
              ${finalValue.toFixed(2)}
            </span>
          </div>
          <div>
            <span style={{ color: '#9ca3af' }}>Trades: </span>
            <span style={{ fontWeight: 'bold' }}>{equityData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EquityChart);
