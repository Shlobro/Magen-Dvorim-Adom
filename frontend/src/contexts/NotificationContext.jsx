// frontend/src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
  Avatar,
  Slide,
  Fade,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  HelpOutline,
} from '@mui/icons-material';

const NotificationContext = createContext();

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  // Snackbar notifications state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
    duration: 4000,
  });

  // Dialog confirmation state
  const [dialog, setDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm', 'alert', 'custom'
    severity: 'info',
    confirmText: 'אישור',
    cancelText: 'ביטול',
    onConfirm: null,
    onCancel: null,
    showCancel: true,
  });

  // Success notification
  const showSuccess = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
      duration,
    });
  };

  // Error notification
  const showError = (message, duration = 6000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
      duration,
    });
  };

  // Warning notification
  const showWarning = (message, duration = 5000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'warning',
      duration,
    });
  };

  // Info notification
  const showInfo = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'info',
      duration,
    });
  };

  // Confirmation dialog
  const showConfirmDialog = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'אישור',
    cancelText = 'ביטול',
    severity = 'warning',
    showCancel = true,
  }) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        title,
        message,
        type: 'confirm',
        severity,
        confirmText,
        cancelText,
        showCancel,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, open: false }));
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, open: false }));
          if (onCancel) onCancel();
          resolve(false);
        },
      });
    });
  };

  // Alert dialog (only OK button)
  const showAlert = ({
    title,
    message,
    severity = 'info',
    confirmText = 'הבנתי',
  }) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        title,
        message,
        type: 'alert',
        severity,
        confirmText,
        showCancel: false,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: null,
      });
    });
  };

  // Close snackbar
  const closeSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Close dialog
  const closeDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  // Get icon for dialog severity
  const getDialogIcon = (severity) => {
    const iconProps = { sx: { fontSize: 48 } };
    switch (severity) {
      case 'success':
        return <CheckCircle color="success" {...iconProps} />;
      case 'error':
        return <Error color="error" {...iconProps} />;
      case 'warning':
        return <Warning color="warning" {...iconProps} />;
      case 'info':
        return <Info color="info" {...iconProps} />;
      default:
        return <HelpOutline color="action" {...iconProps} />;
    }
  };

  // Get color for dialog based on severity
  const getDialogColor = (severity) => {
    switch (severity) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmDialog,
    showAlert,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={closeSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 8, // Account for header height
          '& .MuiSnackbarContent-root': {
            minWidth: '300px',
          }
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            fontSize: '1rem',
            '& .MuiAlert-message': {
              fontWeight: 500,
            },
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog for confirmations and alerts */}
      <Dialog
        open={dialog.open}
        onClose={dialog.showCancel ? closeDialog : undefined}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 4,
            padding: 2,
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          },
        }}
      >
        <Box sx={{ pt: 2, pb: 1 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              backgroundColor: `${getDialogColor(dialog.severity)}15`,
              border: `2px solid ${getDialogColor(dialog.severity)}`,
            }}
          >
            {getDialogIcon(dialog.severity)}
          </Avatar>

          {dialog.title && (
            <DialogTitle
              sx={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: 'text.primary',
                pb: 1,
                textAlign: 'center',
              }}
            >
              {dialog.title}
            </DialogTitle>
          )}

          <DialogContent sx={{ pt: 0 }}>
            <DialogContentText
              sx={{
                fontSize: '1.1rem',
                color: 'text.primary',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              {dialog.message}
            </DialogContentText>
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: 'center',
              gap: 2,
              pt: 2,
              pb: 1,
            }}
          >
            {dialog.showCancel && (
              <Button
                onClick={dialog.onCancel}
                variant="outlined"
                size="large"
                sx={{
                  minWidth: 120,
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 4,
                }}
              >
                {dialog.cancelText}
              </Button>
            )}
            <Button
              onClick={dialog.onConfirm}
              variant="contained"
              size="large"
              sx={{
                minWidth: 120,
                fontWeight: 600,
                borderRadius: 3,
                px: 4,
                backgroundColor: getDialogColor(dialog.severity),
                '&:hover': {
                  backgroundColor: getDialogColor(dialog.severity),
                  filter: 'brightness(0.9)',
                },
              }}
            >
              {dialog.confirmText}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </NotificationContext.Provider>
  );
}
