// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ForcePasswordChange from './ForcePasswordChange';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, userData, loading } = useAuth();

  if (loading) {
    // עדיין טוען את מצב ההתחברות, הצג טוען או null
    return <div>טוען...</div>; // או כל אינדיקטור טעינה אחר
  }

  // אם אין משתמש מחובר, הפנה לדף ההתחברות
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // אם יש משתמש אבל התפקיד שלו לא מתאים, הפנה לדף הבית או דף שגיאה
  if (requiredRole !== undefined && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check if user needs to change password (for Excel imported users)
  if (userData && userData.requirePasswordChange === true) {
    return <ForcePasswordChange />;
  }

  // אם הכל תקין, הצג את הקומפוננטות הילדות
  return children;
};

export default ProtectedRoute;