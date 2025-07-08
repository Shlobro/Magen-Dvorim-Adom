// frontend/src/pages/CoordinatorSignup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { userService } from '../services/firebaseService';

// Only log in development
if (import.meta.env.DEV) {
  console.log('CoordinatorSignup - Using Firebase directly for coordinator signup');
}

// =========================================================
// סגנונות - נשארים זמנית עד שתספק את ה-CSS של SignUp.jsx
// =========================================================
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 'calc(100vh - 60px)', 
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
  textAlign: 'left', // Keep text-align left for LTR input labels
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '1rem',
  color: '#333',
  fontWeight: 'bold',
  textAlign: 'right', // Align labels to the right for RTL
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  direction: 'rtl', // Set input direction to RTL
  textAlign: 'right', // Align input text to the right
};

const buttonStyle = {
  backgroundColor: '#28a745', 
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
  backgroundColor: '#218838',
};

const errorStyle = {
  color: '#e74c3c',
  marginTop: '15px',
  marginBottom: '0',
  fontSize: '0.9rem',
  textAlign: 'center',
};

const successStyle = {
  color: '#28a745',
  marginTop: '15px',
  marginBottom: '0',
  fontSize: '0.9rem',
  textAlign: 'center',
};

// New styles for the ethics checkbox container (consistent with SignUp.jsx)
const checkboxContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '20px', // Added more margin top for separation
  marginBottom: '20px', // Added margin bottom
  fontSize: '0.95rem',
  direction: 'rtl', // For RTL
  textAlign: 'right', // For RTL
  // Adjust padding or width if needed to match other form elements
};

const checkboxLabelStyle = { // Separate style for the checkbox label to allow flexGrow
  flexGrow: 1, // Allow label to take available space
};
// =========================================================

export default function CoordinatorSignup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState(''); // Add password field
  const [confirmPassword, setConfirmPassword] = useState(''); // Add confirm password field
  const [agreeToEthics, setAgreeToEthics] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim() || !city.trim() || !password.trim()) {
      showError('יש למלא את כל השדות הנדרשים.');
      setLoading(false);
      return;
    }

    // Password validation
    if (password.length < 6) {
      showError('הסיסמה חייבת להכיל לפחות 6 תווים.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showError('הסיסמאות אינן תואמות.');
      setLoading(false);
      return;
    }

    // Ethics agreement validation
    if (!agreeToEthics) {
      showError('חובה לאשר את כללי האתיקה כדי להירשם.');
      setLoading(false);
      return;
    }

    try {
      console.log('🔥 Creating coordinator via Firebase...');
      
      // Create coordinator user directly via Firebase
      const coordinatorData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        userType: 1, // Coordinator type
        approved: false, // Needs approval
        requirePasswordChange: true, // Force password change on first login
        password: password.trim() // Use provided password
      };

      const result = await userService.createUser(coordinatorData);
      
      console.log('✅ Coordinator signup successful:', result);
      
      showSuccess('בקשת הרשמה נשלחה בהצלחה! הבקשה שלך תיבדק על ידי רכז קיים ותקבל עדכון בהקדם.');
      
      // Reset form
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setEmail('');
      setCity('');
      setPassword('');
      setConfirmPassword('');
      setAgreeToEthics(false);

      setTimeout(() => {
        navigate('/');
      }, 4000);    } catch (err) {
      console.error('❌ Error creating coordinator:', err);
      if (err.message && err.message.includes('email-already-in-use')) {
        showError('כתובת האימייל כבר רשומה במערכת.');
      } else {
        showError(err.message || 'שגיאה ביצירת חשבון רכז. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>      <div style={formCardStyle}>
        <h2>בקשת הרשמה לרכז חדש</h2>
        <p>טופס זה מיועד לרכזים בלבד, בעמותת "מגן דבורים אדום".</p>
        <p style={{color: '#666', fontSize: '0.9em', marginBottom: '20px'}}>
          הבקשה תיבדק על ידי רכז קיים במערכת ותקבל עדכון על האישור.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label htmlFor="firstName" style={labelStyle}>שם פרטי:</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="lastName" style={labelStyle}>שם משפחה:</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="phoneNumber" style={labelStyle}>מספר טלפון:</label>
            <input
              type="tel" 
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
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
          </div>          <div style={inputGroupStyle}>
            <label htmlFor="city" style={labelStyle}>עיר מגורים:</label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
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
              minLength="6"
              autoComplete="new-password"
              style={inputStyle}
              placeholder="לפחות 6 תווים"
            />
          </div>
          
          <div style={inputGroupStyle}>
            <label htmlFor="confirmPassword" style={labelStyle}>אישור סיסמה:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
              placeholder="הכנס שוב את הסיסמה"
            />
          </div>

          {/* --- New: Ethics checkbox for coordinators --- */}
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="agreeToEthicsCoordinator" // Unique ID for this page
              checked={agreeToEthics}
              onChange={(e) => setAgreeToEthics(e.target.checked)}
              required
            />
            <label htmlFor="agreeToEthicsCoordinator" style={checkboxLabelStyle}>
              אני מאשר/ת שקראתי והבנתי את{' '}
              <Link to="/ethics/coordinators" target="_blank" rel="noopener noreferrer" style={{color: '#28a745', textDecoration: 'underline'}}> {/* Added link styling */}
                כללי האתיקה
              </Link>{' '}
              ומסכים/ה לפעול על פיהם.
            </label>
          </div>
          {/* ------------------------------------------- */}          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#ccc' : buttonStyle.backgroundColor,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor;
              }
            }}
          >
            {loading ? 'שולח בקשה...' : 'שלח בקשת הרשמה'}          </button>
        </form>
      </div>
    </div>
  );
}