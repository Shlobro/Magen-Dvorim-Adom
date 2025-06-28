import React from 'react';
import { Alert, Button, Box, Typography } from '@mui/material';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // Here you could send error to a monitoring service
    // like Sentry, LogRocket, or your own error tracking
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous'
    };

    // Example: send to your backend error endpoint
    if (window.fetch) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      }).catch(err => console.warn('Failed to report error:', err));
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      
      // If a custom fallback component is provided, use it
      if (FallbackComponent) {
        return (
          <FallbackComponent 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 3,
            textAlign: 'center'
          }}
        >
          <AlertTriangle size={64} color="#f44336" style={{ marginBottom: '16px' }} />
          
          <Typography variant="h4" component="h1" gutterBottom color="error">
            משהו השתבש
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            אירעה שגיאה בלתי צפויה. אנא נסה שנית או רענן את הדף.
          </Typography>

          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <Typography variant="body2">
              <strong>שגיאה:</strong> {this.state.error?.message || 'שגיאה לא ידועה'}
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshCw size={16} />}
              onClick={this.handleRetry}
              disabled={this.state.retryCount >= 3}
            >
              נסה שנית ({this.state.retryCount}/3)
            </Button>
            
            <Button
              variant="outlined"
              onClick={this.handleReload}
            >
              רענן דף
            </Button>
          </Box>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                maxWidth: '100%',
                overflow: 'auto'
              }}
            >
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                {this.state.error?.stack}
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', mt: 1 }}>
                {this.state.errorInfo.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error, errorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // You can implement custom error handling logic here
    // For example, show a toast notification or redirect to error page
  };
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, fallbackComponent) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

export default ErrorBoundary;
