import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  Container,
  Card,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Grid,
  Paper,
  Alert
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationCity,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  DeleteForever
} from '@mui/icons-material';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function CoordinatorProfile() {
  const { currentUser, userData, setUserData, updateUserData, updateUserPassword } = useAuth();
  const { showSuccess, showError, showConfirmDialog } = useNotification();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    city: ''
  });

  // Password change form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        city: userData.city || ''
      });
    }
  }, [userData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        showError('שם פרטי, שם משפחה ואימייל הם שדות חובה');
        setLoading(false);
        return;
      }

      // Update profile via API
      const response = await fetch(`/api/users/${currentUser.uid}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          city: formData.city.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update local context data manually since the API call succeeded
      setUserData(prev => ({
        ...prev,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        city: formData.city.trim(),
      }));

      showSuccess('הפרופיל עודכן בהצלחה!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original values
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        city: userData.city || ''
      });
    }
    setEditing(false);
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      // Validate password fields
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showError('יש למלא את כל שדות הסיסמה');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showError('הסיסמאות החדשות אינן תואמות');
        setLoading(false);
        return;
      }

      if (passwordData.currentPassword === passwordData.newPassword) {
        showError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית');
        setLoading(false);
        return;
      }

      // Update password via context
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);

      showSuccess('הסיסמה שונתה בהצלחה!');
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showError('הסיסמה הנוכחית שגויה');
      } else if (error.code === 'auth/weak-password') {
        showError('הסיסמה החדשה חלשה מדי');
      } else {
        showError('שגיאה בשינוי הסיסמה');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSelfDelete = () => {
    showConfirmDialog({
      title: 'מחיקת חשבון רכז',
      message: `האם אתה בטוח שברצונך למחוק את החשבון שלך מהמערכת?\n\nפעולה זו תסיר:\n• את כל הפרטים האישיים שלך\n• את כל פעילותך כרכז במערכת\n• את הגישה שלך למערכת\n• את כל ההיסטוריה שלך\n\nפעולה זו אינה הפיכה ותשפיע על ניהול המערכת!`,
      severity: 'error',
      confirmText: 'מחק את החשבון שלי',
      cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          setLoading(true);
          
          // Call the backend to delete coordinator account
          const response = await fetch(`${API_BASE}/api/coordinators/self/${currentUser.uid}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete account');
          }
          
          showSuccess('החשבון נמחק בהצלחה');
          
          // Sign out and redirect to home
          setTimeout(() => {
            navigate('/');
          }, 2000);
          
        } catch (error) {
          console.error('Error deleting coordinator account:', error);
          showError('שגיאה במחיקת החשבון. אנא נסה שוב.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (!userData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main', 
              fontSize: '2rem',
              mr: 3 
            }}
          >
            {userData.firstName?.[0]?.toUpperCase()}{userData.lastName?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              פרופיל רכז
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {userData.firstName} {userData.lastName}
            </Typography>
          </Box>
          {!editing && (
            <IconButton 
              onClick={() => setEditing(true)}
              color="primary"
              sx={{ 
                bgcolor: 'primary.light', 
                '&:hover': { bgcolor: 'primary.main', color: 'white' }
              }}
            >
              <Edit />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Profile Information */}
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          פרטים אישיים
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם פרטי"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="שם משפחה"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="דואר אלקטרוני"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={editing ? "primary" : "disabled"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="מספר טלפון"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color={editing ? "primary" : "disabled"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="עיר מגורים"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationCity color={editing ? "primary" : "disabled"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons for Profile Editing */}
        {editing && (
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={loading}
              startIcon={<Cancel />}
            >
              ביטול
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 4 }} />

        {/* Password Change Section */}
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          שינוי סיסמה
        </Typography>

        {!changingPassword ? (
          <Button
            variant="outlined"
            onClick={() => setChangingPassword(true)}
            sx={{ mb: 3 }}
          >
            שנה סיסמה
          </Button>
        ) : (
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="סיסמה נוכחית"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="סיסמה חדשה"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  helperText="לפחות 6 תווים"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="אישור סיסמה חדשה"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              >
                {loading ? 'משנה סיסמה...' : 'שנה סיסמה'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                disabled={loading}
              >
                ביטול
              </Button>
            </Box>
          </Paper>
        )}

        {/* Account Information */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          מידע חשבון
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              תאריך הצטרפות:
            </Typography>
            <Typography variant="body1">
              {userData.createdAt 
                ? new Date(userData.createdAt.seconds ? userData.createdAt.seconds * 1000 : userData.createdAt).toLocaleDateString('he-IL')
                : 'לא זמין'
              }
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              סטטוס חשבון:
            </Typography>
            <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
              רכז מאושר
            </Typography>
          </Grid>
        </Grid>

        {/* Account Deletion Section */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'error.main' }}>
          מחיקת חשבון
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>אזהרה:</strong> מחיקת חשבון הרכז היא פעולה בלתי הפיכה שתסיר את כל הנתונים שלך מהמערכת.
            פעולה זו תשפיע על יכולת ניהול המערכת אם אתה הרכז היחיד.
          </Typography>
        </Alert>

        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DeleteForever sx={{ mr: 1, fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              מחיקת חשבון רכז
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
            פעולה זו תמחק לצמיתות:
          </Typography>
          
          <Box component="ul" sx={{ mb: 3, pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              את כל הפרטים האישיים שלך
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              את כל פעילותך כרכז במערכת
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              את הגישה שלך למערכת
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              את כל ההיסטוריה והנתונים שלך
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="error"
            onClick={handleSelfDelete}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteForever />}
            sx={{
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'error.dark',
              }
            }}
          >
            {loading ? 'מוחק חשבון...' : 'מחק את החשבון שלי לצמיתות'}
          </Button>
        </Paper>

        {/* Delete Account Section */}
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
            מחיקת חשבון
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            אם ברצונך למחוק את החשבון שלך, לחץ על הכפתור למטה. שים לב שפעולה זו אינה הפיכה.
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={handleSelfDelete}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteForever />}
          >
            {loading ? 'מוחק חשבון...' : 'מחק את החשבון שלי'}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
