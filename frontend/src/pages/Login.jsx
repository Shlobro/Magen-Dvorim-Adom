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
  backgroundColor: 'rgba(255, 255, 255, 0.5)', // שליטה בעוצמת הכהות כאן
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
};

const buttonHoverStyle = {
  backgroundColor: '#0056b3',
};

const errorStyle = {
  color: '#e74c3c',
  marginTop: '15px',
  marginBottom: '0',
  fontSize: '0.9rem',
};

const successStyle = {
  color: '#28a745',
  marginTop: '15px',
  marginBottom: '0',
  fontSize: '0.9rem',
};

// =========================================================

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, userRole, userData, requiresPasswordChange, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Effect to handle navigation after successful login and data load
  React.useEffect(() => {
    console.log('Login useEffect - userData:', userData);
    console.log('Login useEffect - userRole:', userRole);
    console.log('Login useEffect - authLoading:', authLoading);
    console.log('Login useEffect - loading:', loading);
    console.log('Login useEffect - requiresPasswordChange():', requiresPasswordChange());
    
    if (userData && userRole !== null && !authLoading && !loading) {
      // Check if user needs to change password
      if (requiresPasswordChange()) {
        console.log('User requires password change, navigating to password-change');
        navigate('/password-change');
      } else if (userRole === 1) {
        console.log('User is coordinator, navigating to dashboard');
        navigate('/dashboard');
      } else {
        console.log('User is volunteer, navigating to home');
        navigate('/');
      }
    }
  }, [userData, userRole, authLoading, loading, requiresPasswordChange, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await login(email, password);
      showSuccess('התחברת בהצלחה!');
      console.log('התחברות בוצעה בהצלחה!');
      
      // הnavigation יקרה ב-useEffect אחרי שהנתונים נטענו
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      switch (error.code) {
        case 'auth/invalid-email':
          showError('פורמט אימייל לא תקין.');
          break;
        case 'auth/user-disabled':
          showError('המשתמש הושבת.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          showError('אימייל או סיסמה שגויים.');
          break;
        case 'auth/too-many-requests':
          showError('מספר רב מדי של ניסיונות כניסה כושלים. אנא נסה שוב מאוחר יותר.');
          break;
        default:
          showError('שגיאה בהתחברות. אנא נסה שוב.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={formCardStyle}>
        <h2>התחברות למערכת</h2>
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label htmlFor="email" style={labelStyle}>דואר אלקטרוני:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="password" style={labelStyle}>סיסמה:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
            disabled={loading}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      </div>
    </div>
  );
}
