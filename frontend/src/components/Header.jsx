// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaBell, FaUsers, FaSignInAlt, FaSignOutAlt, FaMapMarkedAlt } from 'react-icons/fa'; // הוסף FaMapMarkedAlt
import mdaLogo from '../assets/mda_logo.png';
import '../styles/Header.css';

// ייבוא AuthContext ו-Firebase Auth
import { useAuth } from '../contexts/AuthContext.jsx'; 
import { auth } from '../firebaseConfig'; 
import { signOut } from 'firebase/auth';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { currentUser, loading, userRole } = useAuth(); // הוסף userRole כדי לבדוק תפקיד

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("התנתקת בהצלחה!");
      setMenuOpen(false); 
    } catch (error) {
      console.error("שגיאה בהתנתקות:", error);
      alert("נכשל בהתנתקות. אנא נסה שוב.");
    }
  };

  if (loading) {
    return null;
  }

  // הגדרת פריטי הניווט בהתאם למצב המשתמש
  const navItemsLoggedIn = [
    { label: 'מסך הקריאות', icon: <FaBell />, to: '/dashboard', isButton: false },
    // הוסף את הקישור למפת המתנדבים כאן
    // נציג אותו רק אם המשתמש הוא רכז (userType === 1)
    ...(userRole === 1 ? [{ label: 'מפת מתנדבים', icon: <FaMapMarkedAlt />, to: '/volunteer-map', isButton: false }] : []),
    { label: 'התנתק', icon: <FaSignOutAlt />, onClick: handleLogout, isButton: true },
  ];

  const navItemsLoggedOut = [
    { label: 'דיווח על נחיל', icon: <FaBell />, to: '/report', isButton: false },
    { label: 'בואו להתנדב!', icon: <FaUsers />, to: '/signup', isButton: false },
    { label: 'התחבר', icon: <FaSignInAlt />, to: '/login', isButton: false },
  ];

  const currentNavItems = currentUser ? navItemsLoggedIn : navItemsLoggedOut;

  return (
    <>
      <div className="header">
        <Link to="/" className="logo-title">
          <img src={mdaLogo} alt="Logo" className="logo" />
          <span className="title">מגן דבורים אדום</span>
        </Link>

        {isMobile ? (
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <FaBars size={28} />
          </button>
        ) : (
          <div className="nav-links">
            {currentNavItems.map((item, index) => (
              item.isButton ? (
                <button key={index} onClick={item.onClick} className="nav-link">
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link key={index} to={item.to} className="nav-link">
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </div>
        )}
      </div>

      {menuOpen && (
        <>
          <div className="overlay" onClick={() => setMenuOpen(false)}></div>
          <div className="side-menu">
            <button className="close-button" onClick={() => setMenuOpen(false)}>
              <FaTimes size={24} />
            </button>
            {currentNavItems.map((item, index) => (
              item.isButton ? (
                <button key={index} onClick={item.onClick} className="menu-item">
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link key={index} to={item.to} className="menu-item" onClick={() => setMenuOpen(false)}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            ))}
          </div>
        </>
      )}
    </>
  );
}