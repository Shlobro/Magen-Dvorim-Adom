import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import '../styles/HomeScreen.css';
import mdaLogo from '../assets/mda_logo.png';
import { FaBell, FaEye, FaEyeSlash, FaUser, FaMapMarkerAlt, FaGraduationCap, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';

import { db, auth } from '../firebaseConfig';
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { validateAddressGeocoding } from '../services/geocoding';
import { userService } from '../services/firebaseService';

export default function SignUp() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [city, setCity] = useState('');
  const [streetName, setStreetName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [beeExperience, setBeeExperience] = useState(false);
  const [beekeepingExperience, setBeekeepingExperience] = useState(false);
  const [hasTraining, setHasTraining] = useState(false);
  const [heightPermit, setHeightPermit] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreeToEthics, setAgreeToEthics] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation logic (keeping all existing validation)
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !email.trim() || !password ||
      !confirmPassword || !city.trim() || !streetName.trim() || !houseNumber.trim() || !idNumber.trim()) {
      showError('אנא מלא את כל השדות הנדרשים (מסומנים בכוכבית).');
      setLoading(false);
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      showError('מספר הטלפון אינו תקין. יש להזין במתכונת: xxx-xxxxxxx או xx-xxxxxx');
      setLoading(false);
      return;
    }
    
    if (!validateEmail(email)) {
      showError('כתובת האימייל אינה תקינה.');
      setLoading(false);
      return;
    }
    
    if (!validateIdNumber(idNumber)) {
      showError('מספר תעודת הזהות חייב להיות בן 9 ספרות.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      showError('הסיסמה חייבת להיות באורך 6 תווים לפחות.');
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      showError('הסיסמאות אינן תואמות. אנא וודא שהזנת את אותה סיסמה בשני השדות.');
      setLoading(false);
      return;
    }
    
    if (isNaN(houseNumber) || parseInt(houseNumber) <= 0) {
      showError('מספר בית חייב להיות מספר חיובי.');
      setLoading(false);
      return;
    }
    
    if (!agreeToEthics) {
      showError('חובה לאשר את כללי האתיקה כדי להירשם.');
      setLoading(false);
      return;
    }
    
    const fullAddress = `${streetName.trim()} ${houseNumber.trim()}`;

    try {
      // **NEW: Check for duplicates before creating user**
      console.log('🔍 Checking for existing users...');
      
      // Check if email already exists in Firestore
      const emailExists = await userService.checkUserExists(email.trim());
      if (emailExists) {
        showError('כתובת אימייל זו כבר רשומה במערכת.');
        setLoading(false);
        return;
      }
      
      // Check if phone number already exists in Firestore
      const phoneExists = await userService.checkUserExistsByPhone(phoneNumber.trim());
      if (phoneExists) {
        showError('מספר הטלפון הזה כבר רשום במערכת.');
        setLoading(false);
        return;
      }
      
      // Check if ID number already exists
      const usersRef = collection(db, 'user');
      const idQuery = query(usersRef, where('idNumber', '==', idNumber.trim()));
      const idSnapshot = await getDocs(idQuery);
      if (!idSnapshot.empty) {
        showError('מספר תעודת זהות זה כבר רשום במערכת.');
        setLoading(false);
        return;
      }
      
      console.log('✅ No duplicates found, proceeding with signup...');

      const geocodingResult = await validateAddressGeocoding(fullAddress, city);
      
      if (!geocodingResult.isValid) {
        showError(geocodingResult.error);
        setLoading(false);
        return;
      }

      const { lat, lng } = geocodingResult.coordinates;
      console.log('Geocode success:', lat, lng);

      // Try to create Firebase Auth user
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ New Firebase Auth user created:', userCredential.user.uid);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          // This means the user was previously deleted from Firestore but Auth account remains
          console.log('🔄 Found orphaned Auth account, attempting to sign in and reuse...');
          
          try {
            // Try to sign in with the provided password
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Successfully signed in to existing Auth account:', userCredential.user.uid);
            
            // We'll reuse this Auth account and create a new Firestore document
            console.log('🔄 Reusing existing Auth account for new signup');
          } catch (signInError) {
            if (signInError.code === 'auth/wrong-password') {
              // User has orphaned Auth account but forgot password
              console.log('🔑 User has orphaned Auth account but wrong password - offering reset option');
              
              // Check if this is actually an orphaned account (no Firestore document)
              const firestoreExists = await userService.checkUserExists(email);
              
              if (!firestoreExists) {
                // This is indeed an orphaned Auth account - offer password reset
                const resetConfirmed = window.confirm(
                  'נמצא חשבון קיים עם כתובת המייל הזו אבל הסיסמה שגויה.\n\n' +
                  'יש לך שתי אפשרויות:\n' +
                  '1. לחץ "אישור" לקבל מייל איפוס סיסמה ולהתחבר עם הסיסמה החדשה\n' +
                  '2. לחץ "ביטול" ונסה סיסמה אחרת\n\n' +
                  'האם תרצה לקבל מייל איפוס סיסמה?'
                );
                
                if (resetConfirmed) {
                  try {
                    const { sendPasswordResetEmail } = await import('firebase/auth');
                    await sendPasswordResetEmail(auth, email);
                    showSuccess(
                      'נשלח מייל איפוס סיסמה לכתובת שלך!\n\n' +
                      'אנא בדוק את המייל שלך (כולל תיקיית הספאם), איפס את הסיסמה, וחזור לכאן להירשם עם הסיסמה החדשה.'
                    );
                    setLoading(false);
                    return;
                  } catch (resetError) {
                    console.error('Password reset error:', resetError);
                    showError('שגיאה בשליחת מייל איפוס סיסמה. אנא נסה שוב או פנה לתמיכה.');
                  }
                } else {
                  showError('אנא נסה סיסמה אחרת או השתמש באפשרות איפוס הסיסמה.');
                }
              } else {
                // User exists in both Auth and Firestore - this is a normal duplicate
                showError('כתובת אימייל זו כבר רשומה במערכת. אם שכחת את הסיסמה, השתמש באפשרות איפוס סיסמה בדף ההתחברות.');
              }
            } else {
              showError('כתובת אימייל זו כבר רשומה במערכת אך לא ניתן להתחבר אליה. אנא פנה לתמיכה.');
            }
            setLoading(false);
            return;
          }
        } else {
          // Other auth errors
          throw authError;
        }
      }
      
      const user = userCredential.user;
      console.log('Using Auth UID for Firestore document:', user.uid);

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
        beeExperience: beeExperience,
        beekeepingExperience: beekeepingExperience,
        hasTraining: hasTraining,
        heightPermit: heightPermit,
        additionalDetails: additionalDetails.trim() || 'אין פרטים נוספים',
        userType: 2,
        createdAt: new Date().toISOString(),
        signupDate: new Date().toLocaleDateString('he-IL'),
        lat,
        lng,
        agreedToEthics: true,
        isActive: true,
      });

      showSuccess('הרשמה בוצעה בהצלחה! תועבר לדף הבית.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Sign-up error:', err);
      let msg = 'שגיאה בהרשמה. אנא נסה שוב.';
      
      if (err.code === 'auth/email-already-in-use') {
        msg = 'כתובת אימייל זו כבר רשומה במערכת.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'הסיסמה חלשה מדי. אנא בחר סיסמה חזקה יותר.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'כתובת אימייל לא תקינה.';
      }
      
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced styles
  const containerStyle = {
    minHeight: '100vh',
    background: '#ffffff',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px',
    color: '#2c3e50',
  };

  const logoStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '4px solid #667eea',
    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
    marginBottom: '20px',
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textShadow: 'none',
    color: '#2c3e50',
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    margin: '0',
    fontWeight: '300',
    color: '#6c757d',
  };

  const formContainerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
  };

  const sectionStyle = {
    marginBottom: '30px',
    padding: '25px',
    borderRadius: '15px',
    border: '1px solid #e0e0e0',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#2c3e50',
  };

  const inputStyle = {
    width: '100%',
    padding: '15px',
    marginBottom: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  const inputFocusStyle = {
    borderColor: '#667eea',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    outline: 'none',
  };

  const passwordContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  };

  const passwordToggleStyle = {
    position: 'absolute',
    left: '15px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#666',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  };

  const checkboxContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '15px',
    fontSize: '16px',
    direction: 'rtl',
    textAlign: 'right',
    minHeight: '24px',
  };

  const checkboxStyle = {
    width: '20px',
    height: '20px',
    accentColor: '#667eea',
    cursor: 'pointer',
    appearance: 'auto',
    WebkitAppearance: 'auto',
    MozAppearance: 'auto',
    margin: '0',
    flexShrink: 0,
  };

  const textareaStyle = {
    width: '100%',
    padding: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
    transition: 'all 0.3s ease',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  const submitButtonStyle = {
    width: '100%',
    padding: '18px',
    background: loading ? 
      'linear-gradient(45deg, #cccccc, #999999)' : 
      'linear-gradient(45deg, #667eea, #764ba2)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: loading ? 'none' : '0 6px 20px rgba(102, 126, 234, 0.3)',
    transform: loading ? 'none' : 'translateY(0)',
  };

  const footerStyle = {
    textAlign: 'center',
    marginTop: '40px',
    color: '#6c757d',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <img src={mdaLogo} alt="לוגו מגן דבורים אדום" style={logoStyle} />
        <h1 style={titleStyle}>בואו להתנדב!</h1>
        <p style={subtitleStyle}>
          יש לכם רצון לתרום לסביבה? דבורים מעניינות אתכם? מקומכם איתנו!
        </p>
      </div>

      <div style={formContainerStyle}>
        <form onSubmit={handleSignUp}>
          {/* Personal Information Section */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <FaUser style={{ color: '#667eea' }} />
              פרטים אישיים
            </div>
            
            <input 
              required 
              value={firstName} 
              onChange={e => setFirstName(e.target.value)} 
              placeholder="שם פרטי *" 
              maxLength="50"
              style={inputStyle}
            />
            <input 
              required 
              value={lastName} 
              onChange={e => setLastName(e.target.value)} 
              placeholder="שם משפחה *" 
              maxLength="50"
              style={inputStyle}
            />
            <input 
              required 
              value={phoneNumber} 
              onChange={handlePhoneChange} 
              placeholder="מספר טלפון * (דוגמה: 03-1234567 או 050-1234567)" 
              maxLength="12"
              style={inputStyle}
            />
            <input 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="דואר אלקטרוני *" 
              type="email"
              style={inputStyle}
            />
            
            <div style={passwordContainerStyle}>
              <input 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="סיסמה (לפחות 6 תווים) *" 
                type={showPassword ? "text" : "password"} 
                minLength="6"
                style={{...inputStyle, paddingLeft: '50px', marginBottom: '0'}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={passwordToggleStyle}
                aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div style={passwordContainerStyle}>
              <input 
                required 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="אישור סיסמה *" 
                type={showConfirmPassword ? "text" : "password"} 
                minLength="6"
                style={{...inputStyle, paddingLeft: '50px', marginBottom: '0'}}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={passwordToggleStyle}
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
              style={inputStyle}
            />
          </div>
          
          {/* Address Information Section */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <FaMapMarkerAlt style={{ color: '#28a745' }} />
              כתובת מגורים
            </div>
            
            <input 
              required 
              value={city} 
              onChange={e => setCity(e.target.value)} 
              placeholder="עיר מגורים *"
              style={inputStyle}
            />
            <input 
              required 
              value={streetName} 
              onChange={e => setStreetName(e.target.value)} 
              placeholder="שם רחוב *"
              style={inputStyle}
            />
            <input 
              required 
              value={houseNumber} 
              onChange={e => setHouseNumber(e.target.value.replace(/\D/g, ''))} 
              placeholder="מספר בית *" 
              type="number"
              min="1"
              style={inputStyle}
            />
          </div>
          
          {/* Experience Section */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <FaGraduationCap style={{ color: '#ffc107' }} />
              ניסיון והכשרה
            </div>
            
            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="beeExperience"
                checked={beeExperience}
                onChange={(e) => setBeeExperience(e.target.checked)}
                style={checkboxStyle}
              />
              <label htmlFor="beeExperience">
                יש לי ניסיון בפינוי נחילי דבורים
              </label>
            </div>

            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="beekeepingExperience"
                checked={beekeepingExperience}
                onChange={(e) => setBeekeepingExperience(e.target.checked)}
                style={checkboxStyle}
              />
              <label htmlFor="beekeepingExperience">
                יש לי ניסיון בגידול דבורים
              </label>
            </div>

            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="hasTraining"
                checked={hasTraining}
                onChange={(e) => setHasTraining(e.target.checked)}
                style={checkboxStyle}
              />
              <label htmlFor="hasTraining">
                עברתי הדרכות רלוונטיות
              </label>
            </div>

            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="heightPermit"
                checked={heightPermit}
                onChange={(e) => setHeightPermit(e.target.checked)}
                style={checkboxStyle}
              />
              <label htmlFor="heightPermit">
                יש לי היתר עבודה בגובה
              </label>
            </div>
          </div>
          
          {/* Additional Information Section */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <FaInfoCircle style={{ color: '#17a2b8' }} />
              מידע נוסף
            </div>
            
            <textarea 
              value={additionalDetails} 
              onChange={e => setAdditionalDetails(e.target.value)} 
              placeholder="פרטים נוספים (אופציונלי)" 
              maxLength="500"
              style={textareaStyle}
            />
          </div>

          {/* Ethics Agreement Section */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <FaShieldAlt style={{ color: '#dc3545' }} />
              אישור כללי אתיקה
            </div>
            
            <div style={checkboxContainerStyle}>
              <input
                type="checkbox"
                id="agreeToEthicsVolunteer"
                checked={agreeToEthics}
                onChange={(e) => setAgreeToEthics(e.target.checked)}
                required
                style={checkboxStyle}
              />
              <label htmlFor="agreeToEthicsVolunteer">
                אני מאשר/ת שקראתי והבנתי את{' '}
                <Link 
                  to="/ethics/volunteers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#667eea', textDecoration: 'underline' }}
                >
                  כללי האתיקה
                </Link>{' '}
                ומסכים/ה לפעול על פיהם.
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            style={submitButtonStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            <FaBell />
            {loading ? 'טוען...' : 'הירשם'}
          </button>
        </form>
      </div>

      <div style={footerStyle}>
        © 2025 מגן דבורים אדום. כל הזכויות שמורות.
      </div>
    </div>
  );
}