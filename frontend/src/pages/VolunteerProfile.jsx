import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Switch,
  Chip
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
  Work,
  Height,
  School,
  Delete
} from '@mui/icons-material';

export default function VolunteerProfile() {
  const { currentUser, userData, setUserData, updateUserPassword } = useAuth();
  const { showSuccess, showError, showConfirmDialog } = useNotification();
  
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
    city: '',
    location: '',
    beeExperience: false,
    beekeepingExperience: false,
    hasTraining: false,
    heightPermit: false
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
        city: userData.city || '',
        location: userData.location || '',
        beeExperience: userData.beeExperience || false,
        beekeepingExperience: userData.beekeepingExperience || false,
        hasTraining: userData.hasTraining || false,
        heightPermit: userData.heightPermit || false
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

      // Update profile via API (using proxy)
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
          location: formData.location.trim(),
          beeExperience: formData.beeExperience,
          beekeepingExperience: formData.beekeepingExperience,
          hasTraining: formData.hasTraining,
          heightPermit: formData.heightPermit
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
        location: formData.location.trim(),
        beeExperience: formData.beeExperience,
        beekeepingExperience: formData.beekeepingExperience,
        hasTraining: formData.hasTraining,
        heightPermit: formData.heightPermit
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
        city: userData.city || '',
        location: userData.location || '',
        beeExperience: userData.beeExperience || false,
        beekeepingExperience: userData.beekeepingExperience || false,
        hasTraining: userData.hasTraining || false,
        heightPermit: userData.heightPermit || false
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

  const handleDeleteAccount = async () => {
    const confirmed = await new Promise((resolve) => {
      showConfirmDialog(
        'מחיקת חשבון מתנדב',
        'האם אתה בטוח שברצונך למחוק את חשבון המתנדב שלך? פעולה זו בלתי הפיכה ותמחק את כל הנתונים שלך מהמערכת.',
        'מחק חשבון',
        'ביטול',
        resolve,
        resolve.bind(null, false),
        'error'
      );
    });

    if (!confirmed) return;

    // Ask for additional confirmation with current password
    const currentPassword = prompt('אנא הזן את הסיסמה הנוכחית שלך לאישור מחיקת החשבון:');
    if (!currentPassword) {
      showError('נדרשת סיסמה לאישור מחיקת החשבון');
      return;
    }

    setLoading(true);
    try {
      // First verify the current password by attempting to update it to itself
      await updateUserPassword(currentPassword, currentPassword);
      
      // If password verification succeeds, proceed with deletion
      const API_BASE = import.meta.env.PROD 
        ? (import.meta.env.VITE_API_BASE || 'https://magen-dvorim-adom-backend.railway.app')
        : (import.meta.env.VITE_API_BASE || 'http://localhost:3001');
      const response = await fetch(`${API_BASE}/api/users/self/${currentUser.uid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('החשבון נמחק בהצלחה. תועבר לדף הבית.');
        
        // Sign out the user and redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(result.message || result.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        showError('הסיסמה שגויה');
      } else if (error.message?.includes('active inquiries')) {
        showError('לא ניתן למחוק את החשבון כאשר יש פניות פעילות המוקצות אליך. אנא השלם את הטיפול או פנה לרכז.');
      } else {
        showError('שגיאה במחיקת החשבון: ' + (error.message || 'שגיאה לא ידועה'));
      }
    } finally {
      setLoading(false);
    }
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
              bgcolor: 'secondary.main', 
              fontSize: '2rem',
              mr: 3 
            }}
          >
            {userData.firstName?.[0]?.toUpperCase()}{userData.lastName?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              פרופיל מתנדב
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

        {/* Personal Information */}
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
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="כתובת מלאה"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={!editing}
              variant={editing ? "outlined" : "filled"}
              InputProps={{
                readOnly: !editing,
              }}
              helperText="כתובת מלאה למיקום מדויק במפה"
            />
          </Grid>
        </Grid>

        {/* Professional Experience */}
        <Divider sx={{ mb: 4 }} />
        
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          <Work sx={{ mr: 1, verticalAlign: 'middle' }} />
          ניסיון מקצועי וכישורים
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.beeExperience}
                  onChange={(e) => handleInputChange('beeExperience', e.target.checked)}
                  disabled={!editing}
                  color="primary"
                />
              }
              label="ניסיון בהוצאת נחילים"
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.beekeepingExperience}
                  onChange={(e) => handleInputChange('beekeepingExperience', e.target.checked)}
                  disabled={!editing}
                  color="primary"
                />
              }
              label="ניסיון בדבורות"
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasTraining}
                  onChange={(e) => handleInputChange('hasTraining', e.target.checked)}
                  disabled={!editing}
                  color="primary"
                />
              }
              label="השתתפות בהדרכה"
              sx={{ width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.heightPermit}
                  onChange={(e) => handleInputChange('heightPermit', e.target.checked)}
                  disabled={!editing}
                  color="primary"
                />
              }
              label="רישיון עבודה בגובה"
              sx={{ width: '100%' }}
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

        {/* Skills Summary */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          סיכום כישורים
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {formData.beeExperience && (
            <Chip 
              label="ניסיון בהוצאת נחילים" 
              color="primary" 
              variant="outlined"
              icon={<Work />}
            />
          )}
          {formData.beekeepingExperience && (
            <Chip 
              label="ניסיון בדבורות" 
              color="primary" 
              variant="outlined"
              icon={<Work />}
            />
          )}
          {formData.hasTraining && (
            <Chip 
              label="השתתפות בהדרכה" 
              color="success" 
              variant="outlined"
              icon={<School />}
            />
          )}
          {formData.heightPermit && (
            <Chip 
              label="רישיון עבודה בגובה" 
              color="warning" 
              variant="outlined"
              icon={<Height />}
            />
          )}
          {!formData.beeExperience && !formData.beekeepingExperience && !formData.hasTraining && !formData.heightPermit && (
            <Typography variant="body2" color="text.secondary">
              אין כישורים מיוחדים רשומים
            </Typography>
          )}
        </Box>

        {/* Account Information */}
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
              מתנדב פעיל
            </Typography>
          </Grid>
        </Grid>

        {/* Delete Account Section */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          מחיקת חשבון
        </Typography>
        
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteAccount}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? 'מוחק חשבון...' : 'מחק חשבון מתנדב'}
        </Button>
      </Card>
    </Container>
  );
}
