// frontend/src/components/ForcePasswordChange.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, VpnKey } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('123456'); // Allow user to input current password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const { currentUser, updateUserPassword, refreshUserData, userData } = useAuth();
  const { showSuccess, showError } = useNotification();

  console.log('ForcePasswordChange: Component mounted with user:', currentUser?.uid);
  console.log('ForcePasswordChange: User data:', userData);

  // Check password status on component mount
  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!currentUser) {
        console.log('ForcePasswordChange: No current user, stopping status check');
        setCheckingStatus(false);
        setPasswordStatus({ requiresPasswordChange: true }); // Default to requiring change
        return;
      }
      
      console.log('ForcePasswordChange: Checking password status for user:', currentUser.uid);
      
      try {
        setCheckingStatus(true);
        const url = `${API_BASE}/api/users/${currentUser.uid}/password-status`;
        console.log('ForcePasswordChange: Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('ForcePasswordChange: Response status:', response.status);
        
        if (response.ok) {
          const status = await response.json();
          console.log('ForcePasswordChange: Password status received:', status);
          setPasswordStatus(status);
          
          // If user doesn't actually require password change, refresh data and let them through
          if (!status.requiresPasswordChange) {
            console.log('User no longer requires password change, refreshing data...');
            await refreshUserData();
            return; // Exit early since password change is not needed
          }
        } else {
          console.warn('Could not check password status, response not ok. Status:', response.status);
          const errorText = await response.text();
          console.warn('Error response:', errorText);
          // If we can't check status, assume password change is needed
          setPasswordStatus({ requiresPasswordChange: true });
        }
      } catch (error) {
        console.error('Error checking password status:', error);
        // On error, assume password change is needed to be safe
        setPasswordStatus({ requiresPasswordChange: true });
      } finally {
        console.log('ForcePasswordChange: Status check completed, setting checkingStatus to false');
        setCheckingStatus(false);
      }
    };

    // Add a timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('ForcePasswordChange: Status check timeout, defaulting to require password change');
      setPasswordStatus({ requiresPasswordChange: true });
      setCheckingStatus(false);
    }, 10000); // 10 second timeout

    checkPasswordStatus().finally(() => {
      clearTimeout(timeout);
    });

    return () => {
      clearTimeout(timeout);
    };
  }, [currentUser, refreshUserData]);

  // Show loading while checking password status
  if (checkingStatus) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">בודק סטטוס סיסמה...</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('User clicked skip status check');
              setCheckingStatus(false);
              setPasswordStatus({ requiresPasswordChange: true });
            }}
            sx={{ mt: 2 }}
          >
            המשך בכל מקרה
          </Button>
        </Card>
      </Container>
    );
  }

  // If user doesn't need to change password, don't show this component
  if (passwordStatus && !passwordStatus.requiresPasswordChange) {
    return null;
  }

  const validatePassword = (password) => {
    const errors = {};
    
    if (password.length < 6) {
      errors.length = 'הסיסמה חייבת להכיל לפחות 6 תווים';
    }
    
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      errors.letters = 'הסיסמה חייבת להכיל לפחות אות אחת באנגלית';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.numbers = 'הסיסמה חייבת להכיל לפחות ספרה אחת';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Debug information
    console.log('ForcePasswordChange: Starting password change process');
    console.log('Current user email:', currentUser?.email);

    // Validate passwords
    const validationErrors = {};
    const passwordErrors = validatePassword(newPassword);
    
    if (Object.keys(passwordErrors).length > 0) {
      validationErrors.password = Object.values(passwordErrors);
    }

    if (newPassword !== confirmPassword) {
      validationErrors.confirm = 'הסיסמאות אינן תואמות';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('ForcePasswordChange: Attempting to update password');
      console.log('Using current password input:', currentPasswordInput);
      
      // Update password in Firebase Auth (using the current password input from user)
      await updateUserPassword(currentPasswordInput, newPassword);
      console.log('ForcePasswordChange: Password updated successfully');
      
      // Update user data via backend API to remove the requirePasswordChange flag
      console.log('ForcePasswordChange: Updating user data to remove password change requirement');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/users/${currentUser.uid}/password-changed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update password change requirement');
      }

      console.log('ForcePasswordChange: User data updated successfully');

      showSuccess('הסיסמה עודכנה בהצלחה! כעת תוכל להמשיך להשתמש במערכת.');
      
      // Refresh the user data to reflect the changes
      try {
        await refreshUserData();
        console.log('ForcePasswordChange: User data refreshed successfully');
      } catch (refreshError) {
        console.warn('ForcePasswordChange: Could not refresh user data, forcing reload:', refreshError);
        // Fallback to page reload if refresh fails
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'שגיאה בעדכון הסיסמה';
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'הסיסמה הנוכחית שגויה. אנא ודא שהזנת את הסיסמה הנוכחית הנכונה. אם זוהי הכניסה הראשונה שלך, השתמש ב-123456.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה החדשה חלשה מדי. אנא בחר סיסמה חזקה יותר.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'נדרשת התחברות מחדש. אנא התנתק והתחבר שוב ולאחר מכן נסה שוב.';
      } else if (error.message && error.message.includes('reauthenticate')) {
        errorMessage = 'שגיאה באימות זהות. אנא ודא שהזנת את הסיסמה הנוכחית הנכונה.';
      } else if (error.message) {
        errorMessage = `שגיאה: ${error.message}`;
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <VpnKey sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            שינוי סיסמה נדרש
          </Typography>
          <Typography variant="body1" color="text.secondary">
            זוהי הכניסה הראשונה שלך למערכת. עליך לשנות את הסיסמה הזמנית לסיסמה אישית חדשה.
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3, textAlign: 'right' }}>
          <strong>חשוב לדעת:</strong>
          <br />
          אם זוהי הכניסה הראשונה שלך, הסיסמה הזמנית שלך היא: <strong>123456</strong>
          <br />
          אם כבר שינית את הסיסמה בעבר, השתמש בסיסמה הנוכחית שלך.
        </Alert>

        <Alert severity="info" sx={{ mb: 3, textAlign: 'right' }}>
          <strong>הודעה:</strong>
          <br />
          אם הסיסמה שלך כבר שונתה אבל אתה עדיין רואה את המסך הזה, זה אומר שהמערכת לא עדכנה את הסטטוס שלך.
          <br />
          במקרה זה, נסה להתנתק ולהתחבר מחדש עם הסיסמה החדשה שלך.
        </Alert>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="סיסמה נוכחית"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPasswordInput}
            onChange={(e) => setCurrentPasswordInput(e.target.value)}
            margin="normal"
            required
            helperText="אם זוהי הכניסה הראשונה שלך, השתמש ב-123456. אחרת, השתמש בסיסמה הנוכחית שלך."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <VpnKey />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="סיסמה חדשה"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            error={!!errors.password}
            helperText={errors.password?.join(', ')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="אימוד סיסמה חדשה"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            error={!!errors.confirm}
            helperText={errors.confirm}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              דרישות סיסמה:
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="caption" 
                color={newPassword.length >= 6 ? 'success.main' : 'text.secondary'}
              >
                ✓ לפחות 6 תווים
              </Typography>
              <br />
              <Typography 
                variant="caption" 
                color={/(?=.*[a-zA-Z])/.test(newPassword) ? 'success.main' : 'text.secondary'}
              >
                ✓ לפחות אות אחת באנגלית
              </Typography>
              <br />
              <Typography 
                variant="caption" 
                color={/(?=.*\d)/.test(newPassword) ? 'success.main' : 'text.secondary'}
              >
                ✓ לפחות ספרה אחת
              </Typography>
            </Box>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'עדכן סיסמה'
            )}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                // Try to refresh user data to see if the password change requirement is still valid
                await refreshUserData();
                showSuccess('נתונים עודכנו. אם הסיסמה שלך כבר שונתה, המסך יעלם.');
              } catch (error) {
                console.error('Error refreshing user data:', error);
                showError('לא ניתן לעדכן את הנתונים. אנא נסה להתנתק ולהתחבר מחדש.');
              } finally {
                setLoading(false);
              }
            }}
            sx={{ mt: 1 }}
          >
            בדוק שוב אם הסיסמה כבר שונתה
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
