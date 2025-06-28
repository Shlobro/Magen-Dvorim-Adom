// src/pages/ReportPage.jsx
import React, { useState, useEffect } from 'react'; // CHANGED: Added useEffect
import { useLocation } from 'react-router-dom'; // NEW: Import useLocation hook
import axios from 'axios';
import '../styles/ReportPage.css'; // Importing the CSS file for styling
import { FaBell, FaUpload } from 'react-icons/fa';
import { saveInquiry, uploadPhoto } from '../services/api'; // ייבוא saveInquiry ו-uploadPhoto משירות ה-API שלך
import { useNotification } from '../contexts/NotificationContext';
import { validateAddressGeocoding } from '../services/geocoding';

export default function ReportPage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState(''); // New state for city
  const [address, setAddress] = useState(''); // New state for address (street and house number)
  const [heightFloor, setHeightFloor] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [imageFile, setImageFile] = useState(null); // To store the actual file
  const [imageName, setImageName] = useState(''); // To display file name
  const [loading, setLoading] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState(''); // NEW: State to store coordinatorId from URL
  const [agreeToTerms, setAgreeToTerms] = useState(false); // State for terms agreement
  
  const { showSuccess, showError } = useNotification();

  const location = useLocation(); // NEW: Initialize useLocation hook

  // NEW: useEffect to read coordinatorId from URL when the component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const idFromUrl = queryParams.get('coordinatorId');
    if (idFromUrl) {
      setCoordinatorId(idFromUrl);
      console.log('Coordinator ID from URL:', idFromUrl); // For debugging
    }
  }, [location.search]); // Depend on location.search so it re-runs if URL query changes

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImageName(e.target.files[0].name);
    } else {
      setImageFile(null);
      setImageName('');
    }
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!fullName || !phoneNumber || !city || !address) {
      showError('אנא מלא את כל שדות החובה: שם מלא, טלפון, עיר וכתובת.');
      setLoading(false);
      return;
    }
    
    if (!agreeToTerms) {
      showError('חובה לאשר את תנאי השירות כדי לשלוח דיווח.');
      setLoading(false);
      return;
    }

    try {
      // Validate address geocoding before submitting
      const geocodingResult = await validateAddressGeocoding(address, city);
      
      if (!geocodingResult.isValid) {
        showError(geocodingResult.error);
        setLoading(false);
        return;
      }

      const inquiryData = {
        fullName,
        phoneNumber,
        city, // Send city
        address, // Send address (street and house number)
        heightFloor,
        additionalDetails,
        status: "נפתחה פנייה (טופס מולא)", // Initial status
        date: new Date().toLocaleDateString('he-IL'), // Current date
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }), // Current time
        coordinatorId: coordinatorId || null, // CHANGED: Add coordinatorId to the inquiry data
                                             // Use null if coordinatorId is an empty string, or '' if you prefer
      };

      // Save inquiry to Firestore via your backend API
      // Assume saveInquiry returns the document ID (or inquiryId) which is needed for image upload
      const response = await saveInquiry(inquiryData);
      // Adjust according to your backend's response structure for the inquiry ID
      const inquiryId = response.data.inquiryId || response.data.id; 

      if (imageFile && inquiryId) {
        await uploadPhoto(inquiryId, imageFile);
      }

      showSuccess('הפנייה נשלחה בהצלחה! תודה רבה על הדיווח.');
      // Clear form fields
      setFullName('');
      setPhoneNumber('');
      setCity('');
      setAddress('');
      setHeightFloor('');      setAdditionalDetails('');
      setImageFile(null);
      setImageName('');
      setCoordinatorId(''); // NEW: Clear coordinatorId after successful submission
      setAgreeToTerms(false); // Clear terms agreement
    } catch (error) {
      console.error('שגיאה בשליחת הפנייה:', error);
      showError(`שגיאה בשליחת הפנייה: ${error.message || 'נסה שוב מאוחר יותר.'}`);
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
            style={{ direction: 'rtl', textAlign: 'right' }} // ⬅️ הוספת יישור RTL
          />
          <input
            type="text"
            placeholder="עיר *" // Input for city
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="כתובת מדויקת (רחוב ומספר בית) *" // Input for address (street + house number)
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
          ></textarea>          <label className="file-upload">
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <FaUpload className="upload-icon" />
            {imageName ? imageName : 'הוסף תמונה של הנחיל (אופציונלי)'}
          </label>          {/* Terms and Conditions */}
          <div className="terms-container">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required
              className="terms-checkbox"
            />
            <label htmlFor="agreeToTerms" className="terms-label">
              <span className="terms-highlight">לידיעת הפונה - עצם מילוי בקשת הפינוי מהווה הסכמת הפונה:</span>
              <br /><br />
              ידוע לי שאם יתברר שהפינוי כרוך בפירוק / הסרה / פגיעה בקיר / תריס / חרת עץ וכיו"ב, שבמסמך נתחיל והוסכם על דעת הפונה והמתנדב ו/או לעמותת "מגן דברים אדום", אין למתנדב על ביצוע הפינוי הנ"ל, כמו כן אין ולא תהיה שום אחריות או התחייבות להחזיר את המצב לקדמותו או לתקן את הנפגע. כמו כן לא תהיה שום אחריות למתנדב ו/או לעמותת "מגן דברים אדום" לגבי כל פגיעה בנפש או כל צד ג' במהלך הפינוי.
              <br /><br />
              עמותת "מגן דברים אדום", רשאים לשלול אלי טופס משוב לגבי הפינוי ו/או דיווח אחר.
              <br /><br />
              <span className="terms-highlight">אני מאשר/ת שקראתי והבנתי את התנאים הנ"ל ומסכים/ה לפעול על פיהם.</span>
            </label>
          </div>          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'שולח...' : (
              <>
                <FaBell className="button-icon" />
                שלח דיווח
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}