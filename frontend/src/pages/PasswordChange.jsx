import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../contexts/NotificationContext';
import homeBackground from '../assets/home-background.png';

// =========================================================
// סגנונות
// =========================================================

const containerStyle = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 60px)',
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
  maxWidth: '400px',
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
  fontSize: '1rem',
  color: '#333',
  fontWeight: 'bold',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const buttonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '12px 25px',
  border: 'none',
  borderRadius: '5px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  width: '100%',
  marginBottom: '10px',
};

const titleStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '10px',
  color: '#007bff',
};

const subtitleStyle = {
  fontSize: '1rem',
  color: '#666',
  marginBottom: '30px',
  lineHeight: '1.5',
};

const errorStyle = {
  color: '#dc3545',
  marginTop: '15px',
  marginBottom: '0',
  fontSize: '0.9rem',
};

// =========================================================

export default function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { updateUserPassword, updateUserData, currentUser, userRole } = useAuth();
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword) {
      setError('יש להזין את הסיסמה הנוכחית');
      return;
    }

    if (!newPassword) {
      setError('יש להזין סיסמה חדשה');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (currentPassword === newPassword) {
      setError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית');
      return;
    }

    setLoading(true);

    try {
      // Update password in Firebase Auth
      await updateUserPassword(currentPassword, newPassword);
      
      // Update user data in Firestore to remove requirePasswordChange flag
      await updateUserData(currentUser.uid, { requirePasswordChange: false });
      
      showSuccess('הסיסמה שונתה בהצלחה!');
      
      // Navigate to appropriate dashboard after successful password change
      setTimeout(() => {
        if (userRole === 1) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 1000);
      
    } catch (err) {
      console.error('Password change error:', err);
      
      if (err.code === 'auth/wrong-password') {
        setError('הסיסמה הנוכחית שגויה');
      } else if (err.code === 'auth/weak-password') {
        setError('הסיסמה החדשה חלשה מדי');
      } else {
        setError('שגיאה בשינוי הסיסמה: ' + err.message);
      }
      showError('שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={formCardStyle}>
        <h1 style={titleStyle}>שינוי סיסמה</h1>
        <p style={subtitleStyle}>
          זוהי הכניסה הראשונה שלך למערכת.<br />
          עליך להחליף את הסיסמה הזמנית לסיסמה בטוחה.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>סיסמה נוכחית:</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={inputStyle}
              required
              placeholder="הזן את הסיסמה הזמנית (123456789)"
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>סיסמה חדשה:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              required
              placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>אימוד סיסמה:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              required
              placeholder="הזן שוב את הסיסמה החדשה"
            />
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#6c757d' : '#007bff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'משנה סיסמה...' : 'שנה סיסמה'}
          </button>
        </form>
      </div>
    </div>
  );
}
