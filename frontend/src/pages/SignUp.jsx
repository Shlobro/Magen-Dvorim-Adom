import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import '../styles/HomeScreen.css';
import mdaLogo from '../assets/mda_logo.png';
import { FaBell, FaEye, FaEyeSlash } from 'react-icons/fa';

import { db, auth } from '../firebaseConfig'; // הוסף auth בחזרה
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // הוסף יצירת משתמש
import { validateAddressGeocoding } from '../services/geocoding';

export default function SignUp() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  // form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // הוחזר!
  const [confirmPassword, setConfirmPassword] = useState(''); // Password confirmation
  const [showPassword, setShowPassword] = useState(false); // Password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Confirm password visibility
  const [city, setCity] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [beeExperience, setBeeExperience] = useState(false); // Changed to boolean
  const [beekeepingExperience, setBeekeepingExperience] = useState(false); // Changed to boolean
  const [hasTraining, setHasTraining] = useState(false); // New training field
  const [heightPermit, setHeightPermit] = useState(false); // Changed to boolean
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreeToEthics, setAgreeToEthics] = useState(false);
  // ui state
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validatePhoneNumber = (phone) => {
    // Israeli phone format: xxx-xxxxxxx or xx-xxxxxx
    const phoneRegex = /^(\d{3}-\d{7}|\d{2}-\d{7})$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdNumber = (id) => {
    // Israeli ID number should be 9 digits
    const idRegex = /^\d{9}$/;
    return idRegex.test(id);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Format based on length
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return value; // Return original if too long
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Basic validation
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !email.trim() || !password ||
      !confirmPassword || !city.trim() || !streetName.trim() || !houseNumber.trim() || !idNumber.trim()) {
      showError('אנא מלא את כל השדות הנדרשים (מסומנים בכוכבית).');
      setLoading(false);
      return;
    }
    
    // 2. Phone number validation
    if (!validatePhoneNumber(phoneNumber)) {
      showError('מספר הטלפון אינו תקין. יש להזין במתכונת: xxx-xxxxxxx או xx-xxxxxx');
      setLoading(false);
      return;
    }
    
    // 3. Email validation
    if (!validateEmail(email)) {
      showError('כתובת האימייל אינה תקינה.');
      setLoading(false);
      return;
    }
    
    // 4. ID number validation
    if (!validateIdNumber(idNumber)) {
      showError('מספר תעודת הזהות חייב להיות בן 9 ספרות.');
      setLoading(false);
      return;
    }
    
    // 5. Password validation
    if (password.length < 6) {
      showError('הסיסמה חייבת להיות באורך 6 תווים לפחות.');
      setLoading(false);
      return;
    }
    
    // 6. Password confirmation validation
    if (password !== confirmPassword) {
      showError('הסיסמאות אינן תואמות. אנא וודא שהזנת את אותה סיסמה בשני השדות.');
      setLoading(false);
      return;
    }
    
    // 7. House number validation
    if (isNaN(houseNumber) || parseInt(houseNumber) <= 0) {
      showError('מספר בית חייב להיות מספר חיובי.');
      setLoading(false);
      return;
    }
    
    // 8. Ethics agreement validation
    if (!agreeToEthics) {
      showError('חובה לאשר את כללי האתיקה כדי להירשם.');
      setLoading(false);
      return;
    }
    
    // Combine street name and house number for address
    const fullAddress = `${streetName.trim()} ${houseNumber.trim()}`;
    // ----------------------------------------

    try {
      // 2. Validate address geocoding BEFORE creating user
      const geocodingResult = await validateAddressGeocoding(fullAddress, city);
      
      if (!geocodingResult.isValid) {
        showError(geocodingResult.error);
        setLoading(false);
        return;
      }

      const { lat, lng } = geocodingResult.coordinates;
      console.log('Geocode success:', lat, lng);

      // 3. Create Firebase Auth user first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Firebase Auth user created:', user.uid);

      // 4. Save volunteer data to Firestore using the Firebase Auth UID
      await setDoc(doc(db, 'user', user.uid), {
        uid: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        city: city.trim(),
        streetName: streetName.trim(),
        houseNumber: houseNumber.trim(),
        address: fullAddress,
        idNumber: idNumber.trim(),
        beeExperience: beeExperience, // Now boolean
        beekeepingExperience: beekeepingExperience, // Now boolean
        hasTraining: hasTraining, // New training field
        heightPermit: heightPermit, // Now boolean
        additionalDetails: additionalDetails.trim() || 'אין פרטים נוספים',
        userType: 2, // User type 2 for volunteers
        createdAt: new Date().toISOString(), // Proper signup date
        signupDate: new Date().toLocaleDateString('he-IL'), // Readable date format
        lat,
        lng,
        agreedToEthics: true,
        isActive: true, // Mark as active volunteer
      });

      showSuccess('הרשמה בוצעה בהצלחה! תועבר לדף הבית.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Sign-up error:', err);
      let msg = 'שגיאה בהרשמה. אנא נסה שוב.';
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/email-already-in-use') {
        msg = 'כתובת אימייל זו כבר רשומה במערכת.';      } else if (err.code === 'auth/weak-password') {
        msg = 'הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'כתובת אימייל לא תקינה.';
      }
      
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
    fontSize: '0.95rem',
    direction: 'rtl',
    textAlign: 'right',
  };

  const labelStyle = {
    flexGrow: 1,
  };

  return (
    <div className="home-page">
      <section className="intro">
        <div className="logo-wrapper">
          <img src={mdaLogo} alt="לוגו מגן דבורים אדום" className="main-logo" />
        </div>
        <h1 className="main-title">בואו להתנדב!</h1>
        <p className="main-paragraph">
          יש לכם רצון לתרום לסביבה? דבורים מעניינות אתכם? מקומכם איתנו!
        </p>
      </section>

      <form className="report-form" onSubmit={handleSignUp}>
        <div className="report-page">
          <div className="report-card">
            {/* Personal Information Section */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#495057', 
                fontSize: '1.2em', 
                textAlign: 'right' 
              }}>
                פרטים אישיים
              </h3>
              <input 
                required 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                placeholder="שם פרטי *" 
                maxLength="50"
              />
              <input 
                required 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                placeholder="שם משפחה *" 
                maxLength="50"
              />
              <input 
                required 
                value={phoneNumber} 
                onChange={handlePhoneChange} 
                placeholder="מספר טלפון * (דוגמה: 03-1234567 או 050-1234567)" 
                maxLength="12"
              />
              <input 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="דואר אלקטרוני *" 
                type="email" 
              />
              
              {/* Password field with visibility toggle */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="סיסמה (לפחות 6 תווים) *" 
                  type={showPassword ? "text" : "password"} 
                  minLength="6"
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Confirm password field with visibility toggle */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  required 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="אישור סיסמה *" 
                  type={showConfirmPassword ? "text" : "password"} 
                  minLength="6"
                  style={{ paddingLeft: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#666',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}
                  aria-label={showConfirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <input 
                required 
                value={idNumber} 
                onChange={e => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 9))} 
                placeholder="תעודת זהות * (9 ספרות)" 
                maxLength="9"
              />
            </div>
            
            {/* Address Information Section */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#1565c0', 
                fontSize: '1.2em', 
                textAlign: 'right' 
              }}>
                כתובת מגורים
              </h3>
              <input 
                required 
                value={city} 
                onChange={e => setCity(e.target.value)} 
                placeholder="עיר מגורים *" 
              />
              <input 
                required 
                value={streetName} 
                onChange={e => setStreetName(e.target.value)} 
                placeholder="שם רחוב *" 
              />
              <input 
                required 
                value={houseNumber} 
                onChange={e => setHouseNumber(e.target.value.replace(/\D/g, ''))} 
                placeholder="מספר בית *" 
                type="number"
                min="1"
              />
            </div>
            
            {/* Experience Section */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#e8f5e9', 
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#2e7d32', 
                fontSize: '1.2em', 
                textAlign: 'right' 
              }}>
                ניסיון והכשרה
              </h3>
              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  id="beeExperience"
                  checked={beeExperience}
                  onChange={(e) => setBeeExperience(e.target.checked)}
                />
                <label htmlFor="beeExperience" style={labelStyle}>
                  יש לי ניסיון בפינוי נחילי דבורים
                </label>
              </div>

              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  id="beekeepingExperience"
                  checked={beekeepingExperience}
                  onChange={(e) => setBeekeepingExperience(e.target.checked)}
                />
                <label htmlFor="beekeepingExperience" style={labelStyle}>
                  יש לי ניסיון בגידול דבורים
                </label>
              </div>

              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  id="hasTraining"
                  checked={hasTraining}
                  onChange={(e) => setHasTraining(e.target.checked)}
                />
                <label htmlFor="hasTraining" style={labelStyle}>
                  עברתי הדרכות רלוונטיות
                </label>
              </div>

              <div style={checkboxContainerStyle}>
                <input
                  type="checkbox"
                  id="heightPermit"
                  checked={heightPermit}
                  onChange={(e) => setHeightPermit(e.target.checked)}
                />
                <label htmlFor="heightPermit" style={labelStyle}>
                  יש לי היתר עבודה בגובה
                </label>
              </div>
            </div>
            
            {/* Additional Information Section */}
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: '#fff3e0', 
              borderRadius: '8px',
              border: '1px solid #ffcc02'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#f57c00', 
                fontSize: '1.2em', 
                textAlign: 'right' 
              }}>
                מידע נוסף
              </h3>
              <textarea 
                value={additionalDetails} 
                onChange={e => setAdditionalDetails(e.target.value)} 
                rows={3} 
                placeholder="פרטים נוספים (אופציונלי)" 
                maxLength="500"
              />
            </div>

            {/* --- הוספת ה-checkbox החדש עבור מתנדבים --- */}
            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="agreeToEthicsVolunteer"
                checked={agreeToEthics}
                onChange={(e) => setAgreeToEthics(e.target.checked)}
                required
              />
              <label htmlFor="agreeToEthicsVolunteer" style={labelStyle}>
                אני מאשר/ת שקראתי והבנתי את{' '}
                <Link to="/ethics/volunteers" target="_blank" rel="noopener noreferrer">
                  כללי האתיקה
                </Link>{' '}
                ומסכים/ה לפעול על פיהם.
              </label>            </div>
            {/* ----------------------------------------------- */}

            <button type="submit" className="submit-button" disabled={loading}>
              <FaBell className="button-icon" />
              {loading ? 'טוען...' : 'הירשם'}
            </button>
          </div>
        </div>
      </form>

      <footer className="footer">© 2025 מגן דבורים אדום. כל הזכויות שמורות.</footer>
    </div>
  );
}