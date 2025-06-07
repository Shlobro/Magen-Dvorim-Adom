// src/pages/ReportPage.jsx
import React, { useState } from 'react';
import '../styles/ReportPage.css';
import { FaBell, FaUpload } from 'react-icons/fa';
import { saveInquiry, uploadPhoto } from '../services/api'; // ייבוא saveInquiry ו-uploadPhoto משירות ה-API שלך
// import { db } from '../firebaseConfig'; // זה לא נחוץ כאן עבור הצד לקוח שמדבר עם בקאנד

export default function ReportPage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState(''); // מצב חדש לעיר
  const [address, setAddress] = useState(''); // מצב חדש לכתובת
  const [heightFloor, setHeightFloor] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [imageFile, setImageFile] = useState(null); // לאחסון הקובץ בפועל
  const [imageName, setImageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageName(e.target.files[0].name);
    } else {
      setImageFile(null);
      setImageName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // אימות בסיסי
    if (!fullName || !phoneNumber || !city || !address) {
      setMessage('אנא מלא את כל שדות החובה: שם מלא, טלפון, עיר וכתובת.');
      setLoading(false);
      return;
    }

    try {
      const inquiryData = {
        fullName,
        phoneNumber,
        city,         // שלח עיר
        address,      // שלח כתובת
        heightFloor,
        additionalDetails,
        status: "נפתחה פנייה (טופס מולא)", // סטטוס התחלתי
        date: new Date().toLocaleDateString('he-IL'), // תאריך נוכחי
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }), // זמן נוכחי
        // inquiryRoutes.js ב-backend יטפל בגיאו-קידוד באמצעות 'address' ו-'city'
        // וישמור lat/lng. אין צורך לשלוח 'location' ישירות מכאן.
      };

      // שמור פנייה ל-Firestore וקבל את ה-ID שלה (חשוב להעלאת תמונה)
      // בהנחה ש-saveInquiry מחזיר את ה-doc ID אם זה מסמך חדש, או משתמש בזה שהועבר.
      // אם שירות ה-saveInquiry שלך לא מחזיר את ה-ID, ייתכן שתצטרך להתאים אותו
      // או לחשוב מחדש איך לקבל את ה-ID להעלאת תמונה.
      // לעת עתה, נניח ש-saveInquiry מקבל ID או מייצר אחד ואנחנו מקבלים אותו בחזרה.
      // ה-backend אמור לייצר את ה-ID אם זו פנייה חדשה. נוודא שה-backend שלנו שומר אותו עם ID שנוצר אוטומטית.
      const response = await saveInquiry(inquiryData);
      const inquiryId = response.data.inquiryId || response.data.id; // התאם לפי מבנה התגובה של ה-backend שלך

      if (imageFile && inquiryId) {
        await uploadPhoto(inquiryId, imageFile);
      }

      setMessage('הפנייה נשלחה בהצלחה! תודה רבה על הדיווח.');
      // נקה טופס
      setFullName('');
      setPhoneNumber('');
      setCity('');
      setAddress('');
      setHeightFloor('');
      setAdditionalDetails('');
      setImageFile(null);
      setImageName('');
    } catch (error) {
      console.error('שגיאה בשליחת הפנייה:', error);
      setMessage(`שגיאה בשליחת הפנייה: ${error.message || 'נסה שוב מאוחר יותר.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-card">
        <h2 className="form-title">דיווח על נחיל דבורים</h2>

        <form className="report-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="שם מלא *"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="מספר טלפון *"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="עיר *" // קלט חדש לעיר
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="כתובת מדויקת (רחוב ומספר בית) *"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="גובה/קומה"
            value={heightFloor}
            onChange={(e) => setHeightFloor(e.target.value)}
          />
          <textarea
            placeholder="פרטים נוספים שיעזרו למתנדב למצוא את הנחיל"
            rows={4}
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
          ></textarea>

          <label className="file-upload">
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <FaUpload className="upload-icon" />
            {imageName ? imageName : 'הוסף תמונה של הנחיל (אופציונלי)'}
          </label>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'שולח...' : (
              <>
                <FaBell className="button-icon" />
                שלח דיווח
              </>
            )}
          </button>
          {message && <p className="form-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}