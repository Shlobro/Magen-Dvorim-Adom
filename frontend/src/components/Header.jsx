// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaBell, FaUsers, FaSignInAlt, FaSignOutAlt, FaMapMarkedAlt, FaChartBar, FaUserCheck, FaUserCog } from 'react-icons/fa'; // הוסף FaMapMarkedAlt, FaChartBar, FaUserCheck ו-FaUserCog

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
      // Replaced alert with console.log as alerts are not supported
      console.log("התנתקת בהצלחה!");
      setMenuOpen(false);
    } catch (error) {
      console.error("שגיאה בהתנתקות:", error);
      // Replaced alert with console.error as alerts are not supported
      console.error("נכשל בהתנתקות. אנא נסה שוב.");
    }
  };
  if (loading) {
    return null;
  }
  
  // הגדרת פריטי הניווט בהתאם למצב המשתמש
  const navItemsLoggedIn = [
    // רכזים (userType === 1) יראו את מסך הקריאות הרגיל
    ...(userRole === 1 ? [{ label: 'מסך הקריאות', icon: <FaBell />, to: '/dashboard', isButton: false }] : []),
    
    // מתנדבים (userType === 2) יראו את לוח המחוונים שלהם
    ...(userRole === 2 ? [{ label: 'הפניות שלי', icon: <FaBell />, to: '/volunteer-dashboard', isButton: false }] : []),
    
    // פרופיל מתנדב
    ...(userRole === 2 ? [{ label: 'הפרופיל שלי', icon: <FaUserCog />, to: '/volunteer-profile', isButton: false }] : []),
    
    // הוסף את הקישור למפת המתנדבים כאן
    // נציג אותו רק אם המשתמש הוא רכז (userType === 1)
    ...(userRole === 1 ? [{ label: 'מפת מתנדבים', icon: <FaMapMarkedAlt />, to: '/volunteer-map', isButton: false }] : []),
    // הוסף את הקישור לדף התובנות כאן
    // נציג אותו רק אם המשתמש הוא רכז (userType === 1)
    ...(userRole === 1 ? [{ label: 'תובנות', icon: <FaChartBar />, to: '/insights', isButton: false }] : []), // <--- חדש: קישור לדף תובנות
    // קישור חדש: ניהול מתנדבים
    ...(userRole === 1 ? [{ label: 'ניהול מתנדבים', icon: <FaUsers />, to: '/volunteer-management', isButton: false }] : []),
    // קישור חדש: אישור רכזים
    ...(userRole === 1 ? [{ label: 'אישור רכזים', icon: <FaUserCheck />, to: '/coordinator-approval', isButton: false }] : []),
    // קישור חדש: פרופיל רכז
    ...(userRole === 1 ? [{ label: 'הפרופיל שלי', icon: <FaUserCog />, to: '/coordinator-profile', isButton: false }] : []),
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
