import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaEye, FaEyeSlash, FaLock, FaTrash, FaEdit, FaSave, FaTimes, FaBug, FaGraduationCap, FaShieldAlt } from 'react-icons/fa';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { validateAddressGeocoding } from '../services/geocoding';
import '../styles/UserProfile.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export default function UserProfile() {
  const { currentUser, userRole, loading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning, showConfirmDialog } = useNotification();
  const navigate = useNavigate();

  // Profile data states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    city: '',
    streetName: '',
    houseNumber: '',
    idNumber: '',
    beeExperience: false,
    beekeepingExperience: false,
    hasTraining: false,
    heightPermit: false,
    additionalDetails: '',
    organizationName: '', // For coordinators
    position: '', // For coordinators
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'user', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phoneNumber: userData.phoneNumber || '',
            email: userData.email || currentUser.email,
            city: userData.city || '',
            streetName: userData.streetName || '',
            houseNumber: userData.houseNumber || '',
            idNumber: userData.idNumber || '',
            beeExperience: userData.beeExperience || false,
            beekeepingExperience: userData.beekeepingExperience || false,
            hasTraining: userData.hasTraining || false,
            heightPermit: userData.heightPermit || false,
            additionalDetails: userData.additionalDetails || '',
            organizationName: userData.organizationName || '',
            position: userData.position || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showError('שגיאה בטעינת הפרופיל');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadProfileData();
    }
  }, [currentUser, authLoading]);

  // Validation functions
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\d{3}-\d{7}|\d{2}-\d{7})$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdNumber = (id) => {
    const idRegex = /^\d{9}$/;
    return idRegex.test(id);
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return value;
  };

  const handleInputChange = (field, value) => {
    if (field === 'phoneNumber') {
      value = formatPhoneNumber(value);
    }
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || 
        !profileData.phoneNumber.trim() || !profileData.city.trim() || 
        !profileData.streetName.trim() || !profileData.houseNumber.trim() || 
        !profileData.idNumber.trim()) {
      showError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    if (!validatePhoneNumber(profileData.phoneNumber)) {
      showError('מספר הטלפון אינו תקין. יש להזין במתכונת: xxx-xxxxxxx או xx-xxxxxx');
      return;
    }

    if (!validateEmail(profileData.email)) {
      showError('כתובת האימייל אינה תקינה');
      return;
    }

    if (!validateIdNumber(profileData.idNumber)) {
      showError('מספר תעודת הזהות חייب להיות בן 9 ספרות');
      return;
    }

    // Validate address
    try {
      setLoading(true);
      const addressValidation = await validateAddressGeocoding(
        `${profileData.streetName} ${profileData.houseNumber}`,
        profileData.city
      );

      if (!addressValidation.isValid) {
        showError(addressValidation.error || 'הכתובת אינה תקינה');
        setLoading(false);
        return;
      }

      // Update profile with geocoded coordinates
      const updatedData = {
        ...profileData,
        lat: addressValidation.coordinates.lat,
        lng: addressValidation.coordinates.lng,
        location: `${profileData.streetName} ${profileData.houseNumber}, ${profileData.city}`,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'user', currentUser.uid), updatedData);
      
      setIsEditing(false);
      showSuccess('הפרופיל עודכן בהצלחה');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showError('אנא מלא את כל שדות הסיסמה');
      return;
    }

    if (newPassword.length < 6) {
      showError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showError('הסיסמאות אינן תואמות');
      return;
    }

    try {
      setLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordSection(false);
      
      showSuccess('הסיסמה שונתה בהצלחה');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showError('הסיסמה הנוכחית שגויה');
      } else {
        showError('שגיאה בשינוי הסיסמה');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirmDialog({
      title: 'מחיקת חשבון',
      message: 'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה.',
      severity: 'error',
      confirmText: 'מחק חשבון',
      cancelText: 'ביטול',
      onConfirm: async () => {
        try {
          setLoading(true);
          
          // Delete user document from Firestore
          await deleteDoc(doc(db, 'user', currentUser.uid));
          
          // Delete Firebase Auth user
          await deleteUser(currentUser);
          
          showSuccess('החשבון נמחק בהצלחה');
          navigate('/');
        } catch (error) {
          console.error('Error deleting account:', error);
          showError('שגיאה במחיקת החשבון. אנא נסה שוב.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Header */}
        <div className="profile-header fade-in">
          <div className="profile-header-content">
            <div className="profile-info">
              <h1>הפרופיל שלי</h1>
              <p>
                {userRole === 1 ? 'רכז' : 'מתנדב'} - {profileData.firstName} {profileData.lastName}
              </p>
            </div>
            <div className="profile-actions">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  <FaEdit />
                  עריכה
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn btn-success"
                  >
                    <FaSave />
                    שמור
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary"
                  >
                    <FaTimes />
                    ביטול
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form-section fade-in">
          <h2 className="section-title">פרטים אישיים</h2>
          
          <div className="form-grid">
            {/* First Name */}
            <div className="form-group">
              <label className="form-label">
                <FaUser />
                שם פרטי *
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן שם פרטי"
              />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label className="form-label">
                <FaUser />
                שם משפחה *
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן שם משפחה"
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">
                <FaPhone />
                מספר טלפון *
              </label>
              <input
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="05X-XXXXXXX"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">
                <FaEnvelope />
                כתובת אימייל *
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled={true}
                className="form-input"
              />
              <p className="form-hint">לא ניתן לשנות כתובת אימייל</p>
            </div>

            {/* City */}
            <div className="form-group">
              <label className="form-label">
                <FaMapMarkerAlt />
                עיר *
              </label>
              <input
                type="text"
                value={profileData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן עיר"
              />
            </div>

            {/* Street Name */}
            <div className="form-group">
              <label className="form-label">
                <FaMapMarkerAlt />
                שם רחוב *
              </label>
              <input
                type="text"
                value={profileData.streetName}
                onChange={(e) => handleInputChange('streetName', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן שם רחוב"
              />
            </div>

            {/* House Number */}
            <div className="form-group">
              <label className="form-label">
                <FaMapMarkerAlt />
                מספר בית *
              </label>
              <input
                type="text"
                value={profileData.houseNumber}
                onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן מספר בית"
              />
            </div>

            {/* ID Number */}
            <div className="form-group">
              <label className="form-label">
                <FaIdCard />
                מספר תעודת זהות *
              </label>
              <input
                type="text"
                value={profileData.idNumber}
                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                disabled={!isEditing}
                className="form-input"
                placeholder="הזן מספר תעודת זהות"
              />
            </div>
          </div>

          {/* Coordinator specific fields */}
          {userRole === 1 && (
            <>
              <h3 className="section-title" style={{marginTop: '2rem'}}>פרטי רכז</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    ארגון
                  </label>
                  <input
                    type="text"
                    value={profileData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן שם ארגון"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    תפקיד
                  </label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    disabled={!isEditing}
                    className="form-input"
                    placeholder="הזן תפקיד"
                  />
                </div>
              </div>
            </>
          )}

          {/* Volunteer specific fields */}
          {userRole === 2 && (
            <>
              <h3 className="section-title" style={{marginTop: '2rem'}}>נסיון והכשרות</h3>
              
              <div className="checkbox-grid">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="beeExperience"
                    checked={profileData.beeExperience}
                    onChange={(e) => handleInputChange('beeExperience', e.target.checked)}
                    disabled={!isEditing}
                    className="checkbox-input"
                  />
                  <label htmlFor="beeExperience" className="checkbox-label">
                    <FaBug />
                    יש לי נסיון עם דבורים
                  </label>
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="beekeepingExperience"
                    checked={profileData.beekeepingExperience}
                    onChange={(e) => handleInputChange('beekeepingExperience', e.target.checked)}
                    disabled={!isEditing}
                    className="checkbox-input"
                  />
                  <label htmlFor="beekeepingExperience" className="checkbox-label">
                    <FaBug />
                    יש לי נסיון בדבורת
                  </label>
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="hasTraining"
                    checked={profileData.hasTraining}
                    onChange={(e) => handleInputChange('hasTraining', e.target.checked)}
                    disabled={!isEditing}
                    className="checkbox-input"
                  />
                  <label htmlFor="hasTraining" className="checkbox-label">
                    <FaGraduationCap />
                    עברתי הכשרה מתאימה
                  </label>
                </div>

                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="heightPermit"
                    checked={profileData.heightPermit}
                    onChange={(e) => handleInputChange('heightPermit', e.target.checked)}
                    disabled={!isEditing}
                    className="checkbox-input"
                  />
                  <label htmlFor="heightPermit" className="checkbox-label">
                    <FaShieldAlt />
                    יש לי אישור עבודה בגובה
                  </label>
                </div>
              </div>

              {/* Additional Details */}
              <div className="form-group" style={{marginTop: '1rem'}}>
                <label className="form-label">
                  פרטים נוספים
                </label>
                <textarea
                  value={profileData.additionalDetails}
                  onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="הזן פרטים נוספים (אופציונלי)"
                />
              </div>
            </>
          )}
        </div>

        {/* Password Section */}
        <div className="password-section fade-in">
          <div className="password-header">
            <h2 className="section-title" style={{marginBottom: 0}}>שינוי סיסמה</h2>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="btn btn-ghost"
            >
              <FaLock />
              {showPasswordSection ? 'סגור' : 'שנה סיסמה'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="password-fields fade-in">
              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">
                  סיסמה נוכחית *
                </label>
                <div className="password-input-group">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-input password-input"
                    placeholder="הזן סיסמה נוכחית"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="password-toggle"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">
                  סיסמה חדשה *
                </label>
                <div className="password-input-group">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input password-input"
                    placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="password-toggle"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">
                  אישור סיסמה חדשה *
                </label>
                <div className="password-input-group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="form-input password-input"
                    placeholder="הזן שוב סיסמה חדשה"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="password-toggle"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="btn btn-primary"
              >
                שמור סיסמה חדשה
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="danger-zone fade-in">
          <h2 className="danger-title">אזור מסוכן</h2>
          <p className="danger-description">
            מחיקת החשבון תסיר את כל הנתונים שלך מהמערכת באופן סופי. פעולה זו אינה הפיכה.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="btn btn-danger"
          >
            <FaTrash />
            מחק חשבון
          </button>
        </div>
      </div>
    </div>
  );
}
