import React, { useMemo } from 'react';
import { CustomChartData } from '../../types';

interface CustomChartViewerProps {
  chartData: CustomChartData;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  width?: number;
  height?: number;
}

const CustomChartViewer: React.FC<CustomChartViewerProps> = ({ 
  chartData, 
  chartType, 
  width = 600, 
  height = 300 
}) => {
  const svgProps = useMemo(() => {
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    return {
      width,
      height,
      padding,
      chartWidth,
      chartHeight
    };
  }, [width, height]);

  const renderBarChart = () => {
    const { padding, chartWidth, chartHeight } = svgProps;
    const maxValue = Math.max(...chartData.datasets[0].data);
    const minValue = Math.min(0, ...chartData.datasets[0].data);    const range = maxValue - minValue || 1;
      const barWidth = chartWidth / chartData.labels.length * 0.8;
    const barSpacing = chartWidth / chartData.labels.length * 0.2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="custom-chart">
        {/* Asse Y */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        
        {/* Asse X */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        {/* Linea dello zero se necessario */}
        {minValue < 0 && (
          <line
            x1={padding}
            y1={height - padding - ((0 - minValue) / range) * chartHeight}
            x2={width - padding}
            y2={height - padding - ((0 - minValue) / range) * chartHeight}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        )}
        
        {/* Barre */}
        {chartData.datasets[0].data.map((value, index) => {
          const x = padding + index * (chartWidth / chartData.labels.length) + barSpacing / 2;
          const barHeight = Math.abs(value / range) * chartHeight;
          const y = value >= 0 
            ? height - padding - ((value - minValue) / range) * chartHeight
            : height - padding - ((0 - minValue) / range) * chartHeight;
          
          const color = Array.isArray(chartData.datasets[0].backgroundColor)
            ? chartData.datasets[0].backgroundColor[index]
            : chartData.datasets[0].backgroundColor || 'rgba(59, 130, 246, 0.8)';

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                stroke={chartData.datasets[0].borderColor || 'rgba(59, 130, 246, 1)'}
                strokeWidth={chartData.datasets[0].borderWidth || 1}
              />
              {/* Etichetta dell'asse X */}
              <text
                x={x + barWidth / 2}
                y={height - padding + 20}
                textAnchor="middle"
                fill="rgba(255,255,255,0.8)"
                fontSize="12"
              >
                {chartData.labels[index]}
              </text>
              {/* Valore sulla barra */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize="11"
                fontWeight="bold"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}
        
        {/* Etichette assi */}
        {chartData.yAxisLabel && (
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="12"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            {chartData.yAxisLabel}
          </text>
        )}
        
        {chartData.xAxisLabel && (
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="12"
          >
            {chartData.xAxisLabel}
          </text>
        )}
      </svg>
    );
  };

  const renderLineChart = () => {
    const { padding, chartWidth, chartHeight } = svgProps;
    const allData = chartData.datasets.flatMap(dataset => dataset.data);    const maxValue = Math.max(...allData);
    const minValue = Math.min(...allData);    const range = maxValue - minValue || 1;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="custom-chart">
        {/* Asse Y */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        
        {/* Asse X */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />

        {chartData.datasets.map((dataset, datasetIndex) => {
          const points = dataset.data.map((value, index) => {
            const x = padding + (index / (chartData.labels.length - 1 || 1)) * chartWidth;
            const y = height - padding - ((value - minValue) / range) * chartHeight;
            return `${x},${y}`;
          }).join(' ');

          const color = dataset.borderColor || `hsl(${datasetIndex * 137.5}, 70%, 60%)`;

          return (
            <g key={datasetIndex}>              <polyline
                points={points}
                fill={dataset.fill ? (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || 'rgba(59, 130, 246, 0.1)' : 'none'}
                stroke={color}
                strokeWidth={dataset.borderWidth || 2}
              />
              
              {/* Punti */}
              {dataset.data.map((value, index) => {
                const x = padding + (index / (chartData.labels.length - 1 || 1)) * chartWidth;
                const y = height - padding - ((value - minValue) / range) * chartHeight;
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Etichette asse X */}
        {chartData.labels.map((label, index) => {
          const x = padding + (index / (chartData.labels.length - 1 || 1)) * chartWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - padding + 20}
              textAnchor="middle"
              fill="rgba(255,255,255,0.8)"
              fontSize="12"
            >
              {label}
            </text>
          );
        })}
        
        {/* Etichette assi */}
        {chartData.yAxisLabel && (
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="12"
            transform={`rotate(-90, 20, ${height / 2})`}
          >
            {chartData.yAxisLabel}
          </text>
        )}
        
        {chartData.xAxisLabel && (
          <text
            x={width / 2}
            y={height - 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize="12"
          >
            {chartData.xAxisLabel}
          </text>
        )}
      </svg>
    );
  };

  const renderPieChart = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;    
    const total = chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="custom-chart">
        {chartData.datasets[0].data.map((value, index) => {
          const angle = (value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            'M', centerX, centerY,
            'L', x1, y1,
            'A', radius, radius, 0, largeArcFlag, 1, x2, y2,
            'Z'
          ].join(' ');

          const color = Array.isArray(chartData.datasets[0].backgroundColor)
            ? chartData.datasets[0].backgroundColor[index]
            : `hsl(${index * 137.5}, 70%, 60%)`;

          // Posizione del testo
          const labelAngle = startAngle + angle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
          const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);

          currentAngle = endAngle;

          return (
            <g key={index}>
              <path
                d={pathData}
                fill={color}
                stroke={chartData.datasets[0].borderColor || '#ffffff'}
                strokeWidth={chartData.datasets[0].borderWidth || 2}
              />
              
              {/* Etichetta */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {chartData.labels[index]}
              </text>
              
              {/* Percentuale */}
              <text
                x={labelX}
                y={labelY + 15}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize="11"
              >
                {((value / total) * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'line':
      case 'area':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };
  return (
    <div className="custom-chart-container">
      {chartData.title && (
        <h3 className="chart-title">{chartData.title}</h3>
      )}
      <div className="chart-wrapper">
        {renderChart()}
      </div>
    </div>
  );
};

export default CustomChartViewer;
