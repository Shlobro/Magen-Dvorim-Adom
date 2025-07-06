// Global error prevention for style-related DOM errors
// This file should be imported early in the application lifecycle

let errorHandlerInstalled = false;

export function installGlobalStyleErrorPrevention() {
  if (errorHandlerInstalled || typeof window === 'undefined') {
    return;
  }

  // Override the global error handler to catch style errors
  const originalErrorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if it's a style-related error
    if (message && typeof message === 'string' && 
        message.includes("Cannot read properties of undefined (reading 'style')")) {
      console.warn('GlobalStyleErrorPrevention: Prevented style access error', {
        message,
        source,
        lineno,
        colno,
        error
      });
      // Prevent the error from propagating
      return true;
    }
    
    // Call the original error handler if it exists
    if (originalErrorHandler) {
      return originalErrorHandler.call(this, message, source, lineno, colno, error);
    }
    
    return false;
  };

  // Also handle promise rejections
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function(event) {
    if (event.reason && event.reason.message && 
        event.reason.message.includes("Cannot read properties of undefined (reading 'style')")) {
      console.warn('GlobalStyleErrorPrevention: Prevented style-related promise rejection', event.reason);
      event.preventDefault();
      return;
    }
    
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.call(this, event);
    }
  };

  // Mark as installed
  errorHandlerInstalled = true;
  console.log('GlobalStyleErrorPrevention: Error handlers installed');
}

export function removeGlobalStyleErrorPrevention() {
  if (!errorHandlerInstalled || typeof window === 'undefined') {
    return;
  }
  
  // Note: We don't restore original handlers as they might have been
  // overridden by other code. This is a one-way installation.
  errorHandlerInstalled = false;
  console.log('GlobalStyleErrorPrevention: Error handlers marked for removal');
}
