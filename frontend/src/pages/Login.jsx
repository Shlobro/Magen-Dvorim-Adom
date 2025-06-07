// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // הוסף Link
import { useAuth } from '../contexts/AuthContext.jsx'; // ייבוא ה-AuthContext שלנו

// =========================================================
// סגנונות - עיצוב בסיסי שמתאים לדפי הרשמה/התחברות
// =========================================================
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 60px)', // פחות גובה של ה-Header
  backgroundColor: '#f4f7f6',
  padding: '20px',
};

const formCardStyle = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center',
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
  backgroundColor: '#007bff', // כחול בהיר
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
  backgroundColor: '#0056b3', // כחול כהה יותר
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, userRole } = useAuth(); // קבל גם את userRole מהקונטקסט

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await login(email, password);
      setSuccess('התחברת בהצלחה!');
      console.log('התחברות בוצעה בהצלחה!');

      // **תיקון קריטי**: ניווט מותנה לאחר התחברות מוצלחת
      // השתמש ב-setTimeout כדי לוודא ש-AuthContext הספיק לעדכן את userRole
      setTimeout(() => {
        if (userRole === 1) { // אם התפקיד הוא רכז
          navigate('/dashboard'); // נווט לדשבורד הרכז
        } else {
          // עבור מתנדבים או משתמשים אחרים, או אם userType הוא null
          navigate('/'); // נווט לדף הבית
        }
      }, 500); // השהיה קצרה (500ms) לוודא שה-userRole התעדכן ב-AuthContext

    } catch (err) {
      console.error('Login error:', err.code, err.message);
      // טיפול בשגיאות ספציפיות של Firebase
      switch (err.code) {
        case 'auth/invalid-email':
          setError('פורמט אימייל לא תקין.');
          break;
        case 'auth/user-disabled':
          setError('המשתמש הושבת.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('אימייל או סיסמה שגויים.');
          break;
        case 'auth/too-many-requests':
          setError('מספר רב מדי של ניסיונות כניסה כושלים. אנא נסה שוב מאוחר יותר.');
          break;
        default:
          setError('שגיאה בהתחברות. אנא נסה שוב.');
          break;
      }
    } finally {
      setLoading(false); // כבה מצב טעינה בסיום (גם בהצלחה וגם בשגיאה)
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2>התחברות למערכת</h2>
        <form onSubmit={handleSubmit}>
          {/* שדה: דואר אלקטרוני */}
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

          {/* שדה: סיסמה */}
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
          </div>

          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
            disabled={loading}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
          {error && <p style={errorStyle}>{error}</p>}
          {success && <p style={successStyle}>{success}</p>}
        </form>
        <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#555' }}>
          אין לך חשבון? <Link to="/signup" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>הירשם כאן</Link>
        </p>
      </div>
    </div>
  );
}