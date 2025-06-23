import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomeScreen.css';
import mdaLogo from '../assets/mda_logo.png';
import { FaBell, FaUsers, FaArrowLeft } from 'react-icons/fa';
import homeBackground from '../assets/home-background.png';

export default function HomeScreen() {
  return (
    <div
      className="home-page"
      style={{ backgroundImage: `url(${homeBackground})` }}
    >
      <div className="content-wrapper">
        <section className="intro">
          <div className="logo-wrapper">
            <img src={mdaLogo} alt="Magen Dvorim Adom Logo" className="main-logo" />
          </div>
          <h1 className="main-title">הצלת נחילי דבורים בישראל</h1>
          <p className="main-paragraph">
            אנחנו רשת של מעל 300 מתנדבים הפועלים להצלת נחילי דבורים ברחבי הארץ. הדבורים חיוניות למערכת האקולוגית שלנו, ואנחנו כאן כדי לעזור להן ולכם.
          </p>
        </section>

        <div className="cards-container">
          <div className="card">
            <FaBell className="card-icon bell" />
            <h2 className="card-title">נתקלתם בנחיל דבורים?</h2>
            <p className="card-text">
              דווחו לנו על מיקום הנחיל ואנחנו נשלח מתנדב מוסמך להעברה בטוחה של הדבורים.
            </p>
            <Link to="/report" className="filled-button">
              <FaBell className="button-icon" />
              דווח על נחיל
              <FaArrowLeft className="arrow-icon" />
            </Link>
          </div>

          <div className="card">
            <FaUsers className="card-icon users" />
            <h2 className="card-title">רוצים להתנדב?</h2>
            <p className="card-text">
              הצטרפו לרשת המתנדבים שלנו ועזרו לנו להציל נחילי דבורים. אנחנו מספקים הדרכה וציוד.
            </p>
            <Link to="/signup" className="outlined-button">
              <FaUsers className="button-icon" />
              להרשמה
              <FaArrowLeft className="arrow-icon" />
            </Link>
          </div>
        </div>

        <section className="stats-section">
          <div className="stat">
            <h3>+300</h3>
            <p>מתנדבים פעילים</p>
          </div>
          <div className="stat">
            <h3>+1000</h3>
            <p>נחילים שהוצלו</p>
          </div>
          <div className="stat">
            <h3>24/7</h3>
            <p>זמינות לקריאות</p>
          </div>
        </section>

        <footer className="footer">
          © 2025 מגן דבורים אדום. כל הזכויות שמורות.
        </footer>
      </div>
    </div>
  );
}