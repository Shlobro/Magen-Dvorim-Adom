// frontend/src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ייבוא useNavigate לצורך ניווט
import '../styles/HomeScreen.css'; // הנתיב לקובץ ה-CSS שלך
import mdaLogo from '../assets/mda_logo.png'; // הנתיב ללוגו שלך
import { FaBell } from 'react-icons/fa'; // אייקון כפתור

// ייבוא שירותי Firebase מהקובץ המקומי
import { auth, db } from '../firebaseConfig'; // ודא שהנתיב נכון להגדרת Firebase בצד הלקוח
import { createUserWithEmailAndPassword } from 'firebase/auth'; // פונקציה ליצירת משתמש חדש
import { collection, doc, setDoc } from 'firebase/firestore'; // פונקציות ל-Firestore
import axios from 'axios'; // לייבוא axios עבור בקשות HTTP (ל-Geocoding)

export default function SignUp() {
  const navigate = useNavigate(); // הוק לניווט

  // מצבים לקלט מהטופס
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // שדה סיסמה לאימות ב-Firebase
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [beeExperience, setBeeExperience] = useState('');
  const [beekeepingExperience, setBeekeepingExperience] = useState('');
  const [heightPermit, setHeightPermit] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  
  // מצבי UI
  const [loading, setLoading] = useState(false); // מצב טעינה (לכפתור)
  const [error, setError] = useState(''); // הודעות שגיאה
  const [success, setSuccess] = useState(''); // הודעות הצלחה

  // פונקציה לטיפול בשליחת הטופס
  const handleSignUp = async (e) => {
    e.preventDefault(); // מונע התנהגות ברירת מחדל של שליחת טופס
    setLoading(true); // הפעל מצב טעינה
    setError(''); // איפוס הודעות קודמות
    setSuccess(''); // איפוס הודעות קודמות

    // ולידציה בסיסית של שדות חובה
    if (!firstName || !lastName || !phoneNumber || !email || !password || !city || !address || !idNumber) {
      setError('אנא מלא את כל השדות הנדרשים (מסומנים בכוכבית).');
      setLoading(false);
      return;
    }

    // ולידציה של סיסמה (לפחות 6 תווים, דרישת Firebase Auth)
    if (password.length < 6) {
        setError('הסיסמה חייבת להיות באורך 6 תווים לפחות.');
        setLoading(false);
        return;
    }

    try {
      // 1. יצירת משתמש חדש באמצעות Firebase Authentication (אימייל וסיסמה)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // קבלת אובייקט המשתמש שנוצר
      console.log('משתמש Firebase Auth נוצר בהצלחה:', user.uid);

      // 2. ביצוע Geocoding (המרת כתובת לקואורדינטות) דרך ה-Backend
      let lat = null;
      let lng = null;
      try {
        const fullAddress = `${address}, ${city}, ישראל`; // בונה את הכתובת המלאה
        console.log('שולח בקשה ל-Geocoding ל-backend עבור הכתובת:', fullAddress);
        // שולח בקשת POST לנקודת הקצה /geocode בשרת ה-backend
        const geoResponse = await axios.post('http://localhost:3001/geocode', { address: fullAddress });
        
        if (geoResponse.data.lat && geoResponse.data.lng) {
          lat = geoResponse.data.lat;
          lng = geoResponse.data.lng;
          console.log('קואורדינטות שהתקבלו מ-Geocoding:', { lat, lng });
        } else {
          console.warn('Geocoding נכשל עבור הכתובת:', fullAddress, 'לא התקבלו קואורדינטות.');
        }
      } catch (geoError) {
        console.error('שגיאה במהלך ביצוע Geocoding:', geoError);
        // ממשיך בלי lat/lng אם ה-Geocoding נכשל, אך מציג הודעת שגיאה
        setError('אירעה שגיאה בקבלת קואורדינטות המיקום עבור הכתובת שלך. אנא נסה שוב או צור קשר עם התמיכה.');
      }


      // 3. שמירת נתוני מתנדב נוספים ב-Firestore
      // נשתמש ב-UID של המשתמש שנוצר ב-Firebase Auth כ-ID של המסמך בקולקציית 'user'
      const userDocRef = doc(collection(db, 'user'), user.uid);
      await setDoc(userDocRef, {
        uid: user.uid, // שמור את ה-UID של המשתמש מ-Firebase Auth
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // שם מלא לתצוגה נוחה
        phoneNumber,
        email,
        city,
        address,
        idNumber,
        beeExperience: beeExperience || 'לא צוין', // ערך ברירת מחדל אם השדה ריק
        beekeepingExperience: beekeepingExperience || 'לא צוין', // ערך ברירת מחדל אם השדה ריק
        heightPermit: heightPermit || 'לא צוין', // ערך ברירת מחדל אם השדה ריק
        additionalDetails: additionalDetails || 'אין פרטים נוספים', // ערך ברירת מחדל אם השדה ריק
        userType: 2, // מניח ש-2 מייצג מתנדב במערכת שלך
        createdAt: new Date().toISOString(), // חותמת זמן ליצירה
        lat, // שמירת קו רוחב שהתקבל מ-Geocoding
        lng, // שמירת קו אורך שהתקבל מ-Geocoding
      });

      setSuccess('הרשמה בוצעה בהצלחה! תועבר לדף הבית.');
      console.log('נתוני מתנדב נשמרו בהצלחה ב-Firestore.');

      // ניווט לדף הבית (או דף כניסה) לאחר הרשמה מוצלחת
      setTimeout(() => {
        navigate('/'); // נווט לדף הבית
      }, 2000); // המתן 2 שניות לפני הניווט

    } catch (firebaseError) {
      console.error('שגיאה במהלך ההרשמה ל-Firebase:', firebaseError);
      let errorMessage = 'שגיאה בהרשמה. אנא נסה שוב.';
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'כתובת אימייל זו כבר בשימוש. אנא השתמש באימייל אחר או התחבר.';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'הסיסמה צריכה להיות באורך 6 תווים לפחות.';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'כתובת אימייל לא חוקית.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // סיים מצב טעינה
    }
  };

  return (
    <div className="home-page">
      <section className="intro">
        <div className="logo-wrapper">
          <img src={mdaLogo} alt="לוגו מגן דבורים אדום" className="main-logo" />
        </div>
        <h1 className="main-title"> בואו להתנדב!</h1>
        <p className="main-paragraph">
          יש לכם רצון לתרום לסביבה? דבורים מעניינות אתכם? מקומכם איתנו!
          מוזמנים להתנדב ולעזור לנו לשמור על המערכת האקולוגית
        </p>
      </section>

      {/* הטופס עם ה-onSubmit handler */}
      <form className="report-form" onSubmit={handleSignUp}>
        <div className="report-page">
          <div className="report-card">
            {/* שדות קלט עם ערכים ומטפלי שינוי */}
            <input type="text" placeholder="שם פרטי *" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input type="text" placeholder="שם משפחה *" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <input type="tel" placeholder="מספר טלפון *" pattern="[0-9]{7,10}" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            <input type="email" placeholder="דואר אלקטרוני *" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="סיסמה (לפחות 6 תווים) *" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="text" placeholder="עיר מגורים *" required value={city} onChange={(e) => setCity(e.target.value)} />
            <input type="text" placeholder="כתובת מלאה *" required value={address} onChange={(e) => setAddress(e.target.value)} />
            <input type="text" placeholder="תעודת זהות *" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
            <input type="text" placeholder="האם יש לך ניסיון בפינוי נחילי דבורים? פרט/י" value={beeExperience} onChange={(e) => setBeeExperience(e.target.value)} />
            <input type="text" placeholder="האם יש לך ניסיון בגידול דבורים? פרט/י" value={beekeepingExperience} onChange={(e) => setBeekeepingExperience(e.target.value)} />
            <input type="text" placeholder="האם יש לך היתר עבודה בגובה? פרט/י" value={heightPermit} onChange={(e) => setHeightPermit(e.target.value)} />

            <textarea placeholder="פרטים נוספים שחשוב שנדע עליך" rows={4} value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)}></textarea>

            {/* הצגת הודעות שגיאה/הצלחה */}
            {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {success && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

            {/* כפתור שליחה - מושבת בזמן טעינה */}
            <button type="submit" className="submit-button" disabled={loading}>
              <FaBell className="button-icon" />
              {loading ? 'מרשם...' : 'הירשם'}
            </button>
          </div>
        </div>
      </form>

      <footer className="footer">
        © 2025 מגן דבורים אדום. כל הזכויות שמורות.
      </footer>
    </div>
  );
}