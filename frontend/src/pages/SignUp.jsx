// frontend/src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/HomeScreen.css';
import mdaLogo from '../assets/mda_logo.png';
import { FaBell } from 'react-icons/fa';

import { db } from '../firebaseConfig'; // הסרנו את auth כי אנחנו לא משתמשים בו ישירות ליצירת משתמש עם סיסמה
import { collection, doc, setDoc } from 'firebase/firestore';
import axios from 'axios';

export default function SignUp() {
  const navigate = useNavigate();

  // form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  // const [password, setPassword] = useState(''); // <--- הוסר
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [beeExperience, setBeeExperience] = useState('');
  const [beekeepingExperience, setBeekeepingExperience] = useState('');
  const [heightPermit, setHeightPermit] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [agreeToEthics, setAgreeToEthics] = useState(false);

  // ui state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ───────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // 1. basic validation
    if (!firstName || !lastName || !phoneNumber || !email ||
      !city || !address || !idNumber) {
      setError('אנא מלא את כל השדות הנדרשים (מסומנים בכוכבית).');
      setLoading(false);
      return;
    }
    // הסיסמה הוסרה, אז אין צורך בבדיקה הזו
    // if (password.length < 6) {
    //   setError('הסיסמה חייבת להיות באורך 6 תווים לפחות.');
    //   setLoading(false);
    //   return;
    // }
    if (!agreeToEthics) {
      setError('חובה לאשר את כללי האתיקה כדי להירשם.');
      setLoading(false);
      return;
    }
    // ----------------------------------------

    try {
      // 2. geocode BEFORE saving the user data
      const geoRes = await axios.post('http://localhost:3001/api/geocode', {
        address,
        city,
      });

      if (!geoRes.data.lat || !geoRes.data.lng) {
        setError('לא הצלחנו לאתר את הכתובת במפה. ודא שהכתובת מדויקת ונסה שוב.');
        setLoading(false);
        return;
      }

      const { lat, lng } = geoRes.data;
      console.log('Geocode success:', lat, lng);

      // 3. saving volunteer doc directly in Firestore
      // כיוון שהסרנו את יצירת המשתמש ב-Firebase Auth, נצטרך ליצור ID ייחודי עבור המסמך.
      // אפשרות אחת היא להשתמש ב-UUID, או פשוט לתת ל-Firestore ליצור ID אוטומטי.
      // לצורך הדוגמה, נשתמש ב-doc() ללא ארגומנטים כדי ש-Firestore תיצור ID אוטומטי.
      const newUserRef = doc(collection(db, 'user')); // יצירת הפנייה למסמך חדש עם ID אוטומטי
      const newUid = newUserRef.id; // שמירת ה-ID שנוצר אוטומטית

      await setDoc(newUserRef, { // שמירת הנתונים למסמך החדש
        uid: newUid, // שימוש ב-ID שנוצר אוטומטית
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phoneNumber,
        email,
        city,
        address,
        idNumber,
        beeExperience: beeExperience || 'לא צוין',
        beekeepingExperience: beekeepingExperience || 'לא צוין',
        heightPermit: heightPermit || 'לא צוין',
        additionalDetails: additionalDetails || 'אין פרטים נוספים',
        userType: 2, // User type 2 for volunteers
        createdAt: new Date().toISOString(),
        lat,
        lng,
        agreedToEthics: true,
      });

      setSuccess('הרשמה בוצעה בהצלחה! תועבר לדף הבית.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Sign-up error:', err);
      let msg = 'שגיאה בהרשמה. אנא נסה שוב.';
      // מכיוון שהסרנו את Firebase Auth, רוב שגיאות auth/email-already-in-use וכו' לא יהיו רלוונטיות כאן ישירות
      // אם תהיה בעיית דוא"ל כפול ב-Firestore, תצטרכו לטפל בזה באופן ידני, לדוגמה ע"י קווארי לפני הוספה.
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  // ───────────────────────────────────────

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
            {/* form inputs */}
            <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="שם פרטי *" />
            <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="שם משפחה *" />
            <input required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="מספר טלפון *" pattern="[0-9]{7,10}" />
            <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="דואר אלקטרוני *" type="email" />
            {/* <input required value={password} onChange={e => setPassword(e.target.value)} placeholder="סיסמה (לפחות 6 תווים) *" type="password" /> */} {/* <--- הוסר */}
            <input required value={city} onChange={e => setCity(e.target.value)} placeholder="עיר מגורים *" />
            <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="כתובת מלאה *" />
            <input required value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="תעודת זהות *" />
            <input value={beeExperience} onChange={e => setBeeExperience(e.target.value)} placeholder="ניסיון בפינוי נחילי דבורים" />
            <input value={beekeepingExperience} onChange={e => setBeekeepingExperience(e.target.value)} placeholder="ניסיון בגידול דבורים" />
            <input value={heightPermit} onChange={e => setHeightPermit(e.target.value)} placeholder="היתר עבודה בגובה" />
            <textarea value={additionalDetails} onChange={e => setAdditionalDetails(e.target.value)} rows={3} placeholder="פרטים נוספים" />

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
              </label>
            </div>
            {/* ----------------------------------------------- */}

            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {success && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

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