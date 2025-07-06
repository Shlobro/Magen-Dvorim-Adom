import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext';
import { userService } from '../services/firebaseService';
import homeBackground from '../assets/home-background.png';

// =========================================================
// סגנונות
// =========================================================

const containerStyle = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundImage: `url(${homeBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: '20px',
  overflow: 'hidden',
};

const overlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  zIndex: 1,
};

const formCardStyle = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '500px',
  textAlign: 'center',
  zIndex: 2,
  position: 'relative',
};

const inputGroupStyle = {
  marginBottom: '20px',
  textAlign: 'left',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#333',
  fontWeight: '500',
  fontSize: '14px',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  fontSize: '16px',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  marginTop: '10px',
};

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, userRole, updatePassword } = useAuth();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showError('הסיסמאות אינן תואמות');
      return;
    }

    if (newPassword.length < 6) {
      showError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);

    try {
      // Update password in Firebase Auth
      await updatePassword(newPassword);

      // Update the requirePasswordChange flag in the database
      // Get current user data and update to remove password change requirement
      try {
        const currentUserData = await userService.getUserProfile(currentUser.uid);
        
        if (currentUserData && currentUserData.requirePasswordChange) {
          // Update user to remove password change requirement
          await userService.updateUserProfile(currentUser.uid, {
            requirePasswordChange: false
          });
        }
      } catch (error) {
        console.error('Error updating password change requirement:', error);
        // Don't fail the whole operation if this update fails
      }

      showSuccess('הסיסמה שונתה בהצלחה!');
      
      // Redirect to appropriate page
      setTimeout(() => {
        if (userRole === 1) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);

    } catch (error) {
      console.error('Password change error:', error);
      showError('שגיאה בשינוי הסיסמה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={formCardStyle}>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>שינוי סיסמה נדרש</h2>
        <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
          זוהי הכניסה הראשונה שלך למערכת. אנא שנה את הסיסמה הדיפולטיבית לסיסמה אישית.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>סיסמה חדשה:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
              minLength="6"
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label style={labelStyle}>אישור סיסמה:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              placeholder="הזן שוב את הסיסמה החדשה"
              minLength="6"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#ccc' : '#007bff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'משנה סיסמה...' : 'שנה סיסמה'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', fontSize: '14px', color: '#666' }}>
          <strong>דרישות סיסמה:</strong><br/>
          • לפחות 6 תווים<br/>
          • מומלץ לכלול אותיות גדולות וקטנות<br/>
          • מומלץ לכלול מספרים וסימנים
        </div>
      </div>
    </div>
  );
}
