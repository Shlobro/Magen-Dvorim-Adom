// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ודא שאתה מייבא את ה-AuthContext

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    // עדיין טוען את מצב ההתחברות, הצג טוען או null
    return <div>טוען...</div>; // או כל אינדיקטור טעינה אחר
  }

  // אם אין משתמש מחובר, הפנה לדף ההתחברות
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // אם יש משתמש אבל התפקיד שלו לא מתאים, הפנה לדף הבית או דף שגיאה
  // (ניתן גם להפנות לדף ייעודי "אין לך הרשאה")
  if (requiredRole !== undefined && userRole !== requiredRole) {
    // כאן היתה הבעיה - סביר להניח שהיה Navigate ל- /report
    // נשנה את זה ל- /login או ל- / (לדף הבית)
    return <Navigate to="/" replace />; // או /login אם אתה רוצה שיחזור ללוגין
  }

  // אם הכל תקין, הצג את הקומפוננטות הילדות
  return children;
};

export default ProtectedRoute;