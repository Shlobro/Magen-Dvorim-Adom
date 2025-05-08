// src/pages/SignUp.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomeScreen.css';
import mdaLogo from '../assets/mda_logo.png';
import { FaBell, FaUsers, FaArrowLeft } from 'react-icons/fa';

export default function SignUp() {
  return (
    <div className="home-page">
      <section className="intro">
        <div className="logo-wrapper">
          <img src={mdaLogo} alt="Magen Dvorim Adom Logo" className="main-logo" />
        </div>
        <h1 className="main-title"> בואו להתנדב!</h1>
        <p className="main-paragraph">
יש לכם רצון לתרום לסביבה? דבורים מעניינות אתכם? מקומכם איתנו!
מוזמנים להתנדב ולעזור לנו לשמור על המערכת האקולוגית        </p>
      </section>



<form className="report-form">
    <div className="report-page">
    <div className="report-card">
  <input type="text" placeholder="שם פרטי *" required />
  <input type="text" placeholder="שם משפחה *" required />
  <input type="tel" placeholder="מספר טלפון *" pattern="[0-9]{10}" required />
  <input type="email" placeholder="דואר אלקטרוני *" required />
  <input type="text" placeholder="עיר מגורים *" required />
  <input type="text" placeholder="כתובת מלאה *" required />
  <input type="text" placeholder="תעודת זהות *" required />
  <input type="text" placeholder="האם יש לך ניסיון בפינוי נחילי דבורים? פרט/י" />
  <input type="text" placeholder="האם יש לך ניסיון בגידול דבורים? פרט/י" />
  <input type="text" placeholder="האם יש לך היתר עבודה בגובה? פרט/י" />

  <textarea placeholder="פרטים נוספים שחשוב שנדע עליך" rows={4}></textarea>

  <button type="submit" className="submit-button">
    <FaBell className="button-icon" />
    הירשם
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
