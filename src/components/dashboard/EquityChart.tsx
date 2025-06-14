import React from 'react';

const EquityChart: React.FC = () => {
  return (
    <div className="equity-section">
      <h3>Equity Curve</h3>
      <div className="equity-chart-large">
        <svg viewBox="0 0 800 200">
          <polyline
            points="50,150 80,145 110,140 140,138 170,135 200,130 230,125 260,120 290,115 320,110 350,105 380,100 410,95 440,90 470,85 500,80 530,75 560,70 590,65 620,60 650,55 680,50 710,45 740,40 770,35"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export default EquityChart;
