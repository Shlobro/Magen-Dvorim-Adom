// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx'; 

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, loading, userRole } = useAuth(); // קבל את userRole (יהיה 1 עבור רכז)

  if (loading) {
    return null; 
  }

  // 1. אם אין משתמש מחובר, נווט לדף ההתחברות
  if (!currentUser) {
    console.log("ProtectedRoute: Not logged in, redirecting to /login");
    return <Navigate to="/login" />;
  }

  // 2. אם יש משתמש, אבל ה-userRole שלו לא תואם ל-requiredRole
  // requiredRole יהיה 1 עבור רכזים. userRole יהיה 1, 0, או null
  if (requiredRole !== undefined && userRole !== requiredRole) { // בדוק ש-requiredRole הוגדר
    console.log(`ProtectedRoute: User is logged in (${currentUser.uid}), but userType '${userRole}' does not match required type '${requiredRole}'. Redirecting to /`);
    return <Navigate to="/" />; 
  }

  // אם כל הבדיקות עברו, הצג את הקומפוננטה המוגנת
  console.log(`ProtectedRoute: Access granted for user ${currentUser.uid} with userType ${userRole}`);
  return children;
}