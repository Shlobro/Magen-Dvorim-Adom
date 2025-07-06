import React from 'react';

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a style-related error
    if (error?.message?.includes("Cannot read properties of undefined (reading 'style')")) {
      console.warn('DashboardErrorBoundary: Caught style access error', error);
      // Try to recover from this error by returning a reset state
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error but don't break the app for style errors
    if (error?.message?.includes("Cannot read properties of undefined (reading 'style')")) {
      console.warn('DashboardErrorBoundary: Style error caught and handled', {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
      // Reset the error state to try to recover
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 100);
      return;
    }
    
    console.error('DashboardErrorBoundary: Unhandled error', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          padding: "20px"
        }}>
          <div style={{
            padding: "40px",
            textAlign: "center",
            background: "#fff3cd",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            border: "1px solid #ffeaa7",
            maxWidth: "600px"
          }}>
            <h2 style={{ color: "#856404", marginBottom: "15px" }}>
              שגיאה זמנית
            </h2>
            <p style={{ color: "#856404", marginBottom: "20px" }}>
              אירעה שגיאה בטעינת הדף. אנא רענן את הדף או נסה שוב מאוחר יותר.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ffc107",
                color: "#212529",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              רענן דף
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: "20px", textAlign: "left" }}>
                <summary style={{ cursor: "pointer", color: "#856404" }}>
                  פרטי שגיאה (מצב פיתוח)
                </summary>
                <pre style={{ 
                  backgroundColor: "#f8f9fa", 
                  padding: "10px", 
                  borderRadius: "5px",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "200px"
                }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
