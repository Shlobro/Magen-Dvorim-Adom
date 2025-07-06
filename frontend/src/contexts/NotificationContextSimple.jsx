// Minimal notification context without Material-UI to avoid DOM issues
import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after specified duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const showSuccess = useCallback((message) => showNotification(message, 'success'), [showNotification]);
  const showError = useCallback((message) => showNotification(message, 'error', 6000), [showNotification]);
  const showWarning = useCallback((message) => showNotification(message, 'warning', 5000), [showNotification]);
  const showInfo = useCallback((message) => showNotification(message, 'info'), [showNotification]);

  const showConfirmDialog = useCallback(({ title, message, confirmText = 'אישור', cancelText = 'ביטול' }) => {
    return new Promise((resolve) => {
      // Safe window access check
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed);
      } else {
        // Fallback to always confirm if window is not available
        console.warn('Window.confirm not available, defaulting to true');
        resolve(true);
      }
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getNotificationStyle = useCallback((type) => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      color: 'white',
      cursor: 'pointer',
      maxWidth: '350px',
      minWidth: '250px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      direction: 'rtl',
      textAlign: 'right',
      position: 'relative',
      transform: 'translateX(0)',
      transition: 'all 0.3s ease-in-out',
      zIndex: 10000,
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#4caf50' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#f44336' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#ff9800' };
      case 'info':
      default:
        return { ...baseStyle, backgroundColor: '#2196f3' };
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirmDialog
    }}>
      {children}
      
      {/* Safe notification display */}
      {typeof window !== 'undefined' && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => removeNotification(notification.id)}
              style={{
                ...getNotificationStyle(notification.type),
                pointerEvents: 'auto',
                animation: 'slideInRight 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ flex: 1 }}>{notification.message}</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  opacity: 0.8,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  minWidth: '20px',
                  textAlign: 'center',
                  lineHeight: '1'
                }}>×</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add CSS for animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}
