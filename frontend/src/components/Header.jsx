// frontend/src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
  const navItemsLoggedIn = [];
  
  // Convert userRole to number for consistent comparison
  const userRoleNum = Number(userRole);
  
  // רכזים (userType === 1) יראו את כל האפשרויות
  if (userRoleNum === 1 || userRole === 1 || userRole === '1') {
    navItemsLoggedIn.push(
      { label: 'מסך הקריאות', icon: <FaBell />, to: '/dashboard', isButton: false },
      { label: 'מפת מתנדבים', icon: <FaMapMarkedAlt />, to: '/volunteer-map', isButton: false },
      { label: 'תובנות', icon: <FaChartBar />, to: '/insights', isButton: false },
      { label: 'ניהול מתנדבים', icon: <FaUsers />, to: '/volunteer-management', isButton: false },
      { label: 'אישור רכזים', icon: <FaUserCheck />, to: '/coordinator-approval', isButton: false },
      { label: 'הפרופיל שלי', icon: <FaUserCog />, to: '/coordinator-profile', isButton: false }
    );
  }
  
  // מתנדבים (userType === 2) יראו את לוח המחוונים שלהם
  if (userRoleNum === 2 || userRole === 2 || userRole === '2') {
    navItemsLoggedIn.push(
      { label: 'הפניות שלי', icon: <FaBell />, to: '/volunteer-dashboard', isButton: false },
      { label: 'הפרופיל שלי', icon: <FaUserCog />, to: '/volunteer-profile', isButton: false }
    );
  }
  
  // כל המשתמשים יראו התנתק
  navItemsLoggedIn.push({ label: 'התנתק', icon: <FaSignOutAlt />, onClick: handleLogout, isButton: true });

  const navItemsLoggedOut = [
    { label: 'בואו להתנדב!', icon: <FaUsers />, to: '/signup', isButton: false },
    { label: 'התחבר', icon: <FaSignInAlt />, to: '/login', isButton: false },
  ];

  const currentNavItems = currentUser ? navItemsLoggedIn : navItemsLoggedOut;
  
  // If we have a logged in user but no nav items (except logout), something is wrong
  if (currentUser && navItemsLoggedIn.length <= 1) {
    console.warn('Header - WARNING: Logged in user but no nav items! userRole might not be loaded correctly');
    console.warn('Header - Adding fallback navigation items...');
    console.warn('Header - userRole value:', userRole, 'type:', typeof userRole);
    
    // Add some basic fallback navigation (insert before logout)
    const logoutItem = navItemsLoggedIn.pop(); // Remove logout temporarily
    
    // Add default volunteer navigation as fallback
    navItemsLoggedIn.push(
      { label: 'הפניות שלי', icon: <FaBell />, to: '/volunteer-dashboard', isButton: false },
      { label: 'הפרופיל שלי', icon: <FaUserCog />, to: '/volunteer-profile', isButton: false }
    );
    navItemsLoggedIn.push(logoutItem); // Add logout back at the end
    
    console.warn('Header - Fallback navigation added:', navItemsLoggedIn.map(item => item.label));
  }
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
          <div className="nav-links" style={{ position: 'relative', zIndex: 1000 }}>
            {currentNavItems.map((item, index) => (
              item.isButton ? (
                <button 
                  key={index} 
                  onClick={() => {
                    item.onClick();
                  }} 
                  className="nav-link"
                  style={{ position: 'relative', zIndex: 1001, pointerEvents: 'auto' }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <button 
                  key={index} 
                  className="nav-link"
                  style={{ position: 'relative', zIndex: 1001, pointerEvents: 'auto' }}
                  onClick={() => {
                    navigate(item.to);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
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
                <button 
                  key={index} 
                  onClick={() => {
                    item.onClick();
                  }} 
                  className="menu-item"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ) : (
                <button 
                  key={index} 
                  className="menu-item" 
                  onClick={() => {
                    navigate(item.to);
                    setMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            ))}
          </div>
        </>
      )}
    </>
  );
}
