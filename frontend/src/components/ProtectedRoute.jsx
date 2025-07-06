// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ForcePasswordChange from './ForcePasswordChange';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, userData, loading } = useAuth();

  if (loading) {
    // Show a proper loading indicator while auth state is being determined
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666', margin: 0 }}>טוען...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // אם אין משתמש מחובר, הפנה לדף ההתחברות
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // אם יש משתמש אבל התפקיד שלו לא מתאים, הפנה לדף הבית או דף שגיאה
  if (requiredRole !== undefined) {
    // Map userRole numbers to role names
    const roleMap = {
      1: 'coordinator',
      2: 'volunteer'
    };
    
    const userRoleName = roleMap[userRole];
    console.log('ProtectedRoute - userRole:', userRole, 'userRoleName:', userRoleName, 'requiredRole:', requiredRole);
    
    if (userRoleName !== requiredRole) {
      console.log('ProtectedRoute - Access denied, redirecting to home');
      return <Navigate to="/" replace />;
    }
  }

  // Check if user needs to change password (for Excel imported users)
  // Make sure userData is loaded and contains the requirePasswordChange flag
  if (userData && userData.requirePasswordChange === true) {
    return <ForcePasswordChange />;
  }

  // אם הכל תקין, הצג את הקומפוננטות הילדות
  return children;
};

export default ProtectedRoute;