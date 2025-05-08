import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaBell, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import mdaLogo from '../assets/mda_logo.png';
import '../styles/Header.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  const navItems = [
    { label: 'דף הבית', icon: <FaHome />, to: '/' },
    { label: 'דיווח על נחיל', icon: <FaBell />, to: '/report' },
    { label: 'מתנדבים', icon: <FaUsers />, to: '/volunteers' },
    { label: 'התנתק', icon: <FaSignOutAlt />, to: '/logout' },
  ];

  return (
    <>
      <div className="header">
        {/* צד ימין - לוגו וטקסט */}
        <div className="logo-title">
          <img src={mdaLogo} alt="Logo" className="logo" />
          <span className="title">מגן דבורים אדום</span>
        </div>

        {/* צד שמאל - ניווט */}
        {isMobile ? (
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <FaBars size={24} />
          </button>
        ) : (
          <div className="nav-links">
            {navItems.map((item, index) => (
              <Link key={index} to={item.to} className="nav-link">
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* תפריט צד במובייל */}
      {menuOpen && (
        <>
          <div className="overlay" onClick={() => setMenuOpen(false)}></div>
          <div className="side-menu">
            <button className="close-button" onClick={() => setMenuOpen(false)}>
              <FaTimes size={24} />
            </button>
            {navItems.map((item, index) => (
              <Link key={index} to={item.to} className="menu-item" onClick={() => setMenuOpen(false)}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
