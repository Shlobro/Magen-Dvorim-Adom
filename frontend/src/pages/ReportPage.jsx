// src/pages/ReportPage.jsx
import React, { useState } from 'react';
import '../styles/ReportPage.css';
import { FaBell, FaUpload } from 'react-icons/fa';

export default function ReportPage() {
  const [imageName, setImageName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageName(e.target.files[0].name);
    }
  };

  return (
    <div className="report-page">
      <div className="report-card">
        <h2 className="form-title">דיווח על נחיל דבורים</h2>

        <form className="report-form">
          <input type="text" placeholder="שם מלא *" required />
          <input type="tel" placeholder="מספר טלפון" />
          <input type="text" placeholder="כתובת מדויקת *" required />
          <input type="text" placeholder="גובה/קומה" />
          <textarea placeholder="פרטים נוספים שיעזרו למתנדב למצוא את הנחיל" rows={4}></textarea>

          <label className="file-upload">
            <input type="file" onChange={handleFileChange} />
            <FaUpload className="upload-icon" />
            {imageName ? imageName : 'הוסף תמונה של הנחיל'}
          </label>

          <button type="submit" className="submit-button">
            <FaBell className="button-icon" />
            שלח דיווח
          </button>
        </form>
      </div>

      <footer className="footer">
        © 2025 מגן דבורים אדום. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
