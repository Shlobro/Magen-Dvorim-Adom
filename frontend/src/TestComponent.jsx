// Test component to isolate the y is not a constructor error
import React from 'react';

const TestComponent = () => {
  console.log('TestComponent rendering...');
  
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>Test Component</h1>
      <p>If you can see this, React is working correctly.</p>
      <button onClick={() => console.log('Button clicked')}>
        Test Button
      </button>
    </div>
  );
};

export default TestComponent;
