// frontend/src/components/ForcePasswordChange.jsx
import React, { useState } from 'react';
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

export default function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { currentUser, updateUserPassword, updateUserData } = useAuth();
  const { showSuccess, showError } = useNotification();

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
      // Update password in Firebase Auth (using default password for reauthentication)
      await updateUserPassword('123456', newPassword);
      
      // Update user data to remove the requirePasswordChange flag
      await updateUserData(currentUser.uid, {
        requirePasswordChange: false,
        passwordLastChanged: new Date()
      });

      showSuccess('הסיסמה עודכנה בהצלחה! כעת תוכל להמשיך להשתמש במערכת.');
      
      // The app will automatically redirect once requirePasswordChange is false
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'שגיאה בעדכון הסיסמה';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'הסיסמה הנוכחית שגויה';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה חלשה מדי';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'נדרשת התחברות מחדש. אנא התנתק והתחבר שוב.';
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

        <Alert severity="info" sx={{ mb: 3, textAlign: 'right' }}>
          הסיסמה הנוכחית שלך היא: <strong>123456</strong>
          <br />
          אנא בחר סיסמה חדשה וחזקה עבור החשבון שלך.
        </Alert>

        <Box component="form" onSubmit={handleSubmit}>
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
        </Box>
      </Card>
    </Container>
  );
}
