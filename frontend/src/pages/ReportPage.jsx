// src/pages/ReportPage.jsx
import React, { useState } from 'react';
import '../styles/ReportPage.css'; // Importing the CSS file for styling
import { FaBell, FaUpload } from 'react-icons/fa';
import { saveInquiry, uploadPhoto } from '../services/api'; // ייבוא saveInquiry ו-uploadPhoto משירות ה-API שלך

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
  const [message, setMessage] = useState(''); // For success/error messages

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
    setMessage(''); // Clear previous messages

    // Basic validation
    if (!fullName || !phoneNumber || !city || !address) {
      setMessage('אנא מלא את כל שדות החובה: שם מלא, טלפון, עיר וכתובת.');
      setLoading(false);
      return;
    }

    try {
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
        // The backend (inquiryRoutes.js) will handle geocoding using 'address' and 'city'
        // and save lat/lng. No need to send 'location' directly from here.
      };

      // Save inquiry to Firestore via your backend API
      // Assume saveInquiry returns the document ID (or inquiryId) which is needed for image upload
      const response = await saveInquiry(inquiryData);
      // Adjust according to your backend's response structure for the inquiry ID
      const inquiryId = response.data.inquiryId || response.data.id; 

      if (imageFile && inquiryId) {
        await uploadPhoto(inquiryId, imageFile);
      }

      setMessage('הפנייה נשלחה בהצלחה! תודה רבה על הדיווח.');
      // Clear form fields
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