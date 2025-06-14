import React from 'react';

const TestCustomChartsPage: React.FC = () => {
  console.log('TestCustomChartsPage loaded!!!');
  
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>Test Custom Charts Page</h2>
      <p>Se vedi questo messaggio, il componente si sta caricando correttamente.</p>
      <button onClick={() => console.log('Button clicked!')}>
        Test Console Log
      </button>
    </div>
  );
};

export default TestCustomChartsPage;
