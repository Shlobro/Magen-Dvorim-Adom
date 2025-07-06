// Hook tracing utility to debug React hooks errors
let hookCallCount = 0;
let renderCount = 0;
let hookCallHistory = [];
let traceMessages = [];

export const resetHookTracer = () => {
  hookCallCount = 0;
  renderCount++;
  if (renderCount > 1) {
    const msg = `🔄 Render #${renderCount}, previous hook count was: ${hookCallHistory[hookCallHistory.length - 1] || 0}`;
    console.log(msg);
    traceMessages.push(msg);
  }
  hookCallHistory.push(0);
};

export const traceHook = (hookName, component = 'Dashboard') => {
  hookCallCount++;
  hookCallHistory[hookCallHistory.length - 1] = hookCallCount;
  const msg = `${component} - Hook #${hookCallCount}: ${hookName} (Render #${renderCount})`;
  console.log(msg);
  traceMessages.push(msg);
  
  if (renderCount > 1 && hookCallCount > (hookCallHistory[hookCallHistory.length - 2] || 0)) {
    const errorMsg = `⚠️ MORE HOOKS THAN PREVIOUS RENDER! Current: ${hookCallCount}, Previous: ${hookCallHistory[hookCallHistory.length - 2] || 0}`;
    console.warn(errorMsg);
    traceMessages.push(errorMsg);
    console.trace('Hook call stack:');
    
    // Show on screen for visibility
    if (typeof window !== 'undefined' && window.document) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed; 
        top: 10px; 
        right: 10px; 
        background: red; 
        color: white; 
        padding: 10px; 
        z-index: 9999; 
        border-radius: 5px;
        max-width: 400px;
        font-family: monospace;
      `;
      errorDiv.innerHTML = `<strong>HOOK ERROR:</strong><br/>${errorMsg}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }
  
  return hookCallCount;
};

export const getHookStats = () => ({
  currentRender: renderCount,
  currentHookCount: hookCallCount,
  history: [...hookCallHistory],
  messages: [...traceMessages]
});

// Function to display trace on screen
export const showHookTrace = () => {
  if (typeof window !== 'undefined' && window.document) {
    const traceDiv = document.createElement('div');
    traceDiv.style.cssText = `
      position: fixed; 
      bottom: 10px; 
      left: 10px; 
      background: rgba(0,0,0,0.8); 
      color: lime; 
      padding: 10px; 
      z-index: 9999; 
      border-radius: 5px;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
    `;
    traceDiv.innerHTML = `<strong>Hook Trace:</strong><br/>${traceMessages.slice(-10).join('<br/>')}`;
    document.body.appendChild(traceDiv);
    setTimeout(() => traceDiv.remove(), 10000);
  }
};
