// frontend/src/pages/CoordinatorSignup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebaseConfig'; 

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
  const [password, setPassword] = useState('');
  const [agreeToEthics, setAgreeToEthics] = useState(false); // New state for ethics checkbox
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (password.length < 6) {
      setError('הסיסמה חייבת להיות באורך 6 תווים לפחות.');
      return;
    }

    // Ethics agreement validation
    if (!agreeToEthics) {
      setError('חובה לאשר את כללי האתיקה כדי להירשם.');
      return;
    }

    try {
      // 1. יצירת משתמש ב-Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created in Firebase Auth:', user.uid);

      // 2. שמירת פרטי הרכז בקולקציית 'user'
      await setDoc(doc(db, 'user', user.uid), {
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        email: user.email, 
        userType: 1, // קבוע עבור רכזים
        beeFarmingExperience: null,
        beeRemovalExperience: null,
        city: null,
        heightWorkPermit: null,
        idNumber: null,
        location: null, 
        name: `${firstName} ${lastName}`, 
        registrationDate: new Date(), 
        agreedToEthics: true, // New: Record ethics agreement
      });
      console.log('Coordinator data saved in "user" collection for user:', user.uid);

      setSuccess('הרשמה בוצעה בהצלחה! כעת ניתן להתחבר.');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setEmail('');
      setPassword(''); 
      setAgreeToEthics(false); // Reset checkbox state

      setTimeout(() => {
        navigate('/login');
      }, 2000); 

    } catch (err) {
      console.error('שגיאה בהרשמת רכז:', err.code, err.message);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('האימייל כבר בשימוש. אנא נסה אימייל אחר או התחבר.');
          break;
        case 'auth/weak-password':
          setError('הסיסמה חלשה מדי. אנא הזן סיסמה בעלת 6 תווים לפחות.');
          break;
        case 'auth/invalid-email':
          setError('פורמט אימייל לא תקין.');
          break;
        default:
          setError('שגיאה בהרשמה. אנא נסה שוב.');
          break;
      }
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2>הרשמת רכז חדש</h2>
        <p>טופס זה מיועד לרכזים בלבד, בעמותת "מגן דבורים אדום".</p> {/* Updated org name */}
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
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="password" style={labelStyle}>סיסמה (לפחות 6 תווים):</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
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
          {/* ------------------------------------------- */}

          <button
            type="submit"
            style={buttonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor}
          >
            הירשם כרכז
          </button>
          {error && <p style={errorStyle}>{error}</p>}
          {success && <p style={successStyle}>{success}</p>}
        </form>
      </div>
    </div>
  );
}