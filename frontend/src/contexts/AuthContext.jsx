// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword as firebaseUpdatePassword } from 'firebase/auth'; // ייבוא signOut
import { doc, getDoc } from 'firebase/firestore'; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  // פונקציית התחברות
  const login = async (email, password) => {
    try {
      // נסה להתחבר באמצעות Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", userCredential.user.uid);
      // ה-onAuthStateChanged listener יטפל בעדכון currentUser ו-userRole
      return userCredential; // החזר את ה-userCredential במקרה הצלחה
    } catch (error) {
      console.error("AuthContext: Login error:", error.code, error.message);
      throw error; // זרוק את השגיאה הלאה למי שקורא לפונקציה (Login.jsx)
    }
  };

  // פונקציית התנתקות (נוסיף אותה עכשיו כי היא שימושית)
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
      // ה-onAuthStateChanged listener יטפל בעדכון currentUser ו-userRole
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
      throw error;
    }
  };

  // פונקציית עדכון סיסמה
  const updatePassword = async (newPassword) => {
    if (!currentUser) {
      throw new Error('משתמש לא מחובר');
    }
    
    try {
      await firebaseUpdatePassword(currentUser, newPassword);
      console.log("Password updated successfully");
    } catch (error) {
      console.error("AuthContext: Update password error:", error);
      throw error;
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // אם משתמש מחובר, נסה לטעון את התפקיד/סוג המשתמש שלו מ-Firestore
        try {
          const userDocRef = doc(db, 'user', user.uid); 
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserRole(userData.userType); 
            console.log("AuthContext: User data loaded:", userData);
            console.log("AuthContext: User Type:", userData.userType);
          } else {
            console.log("AuthContext: No user data found in 'user' collection for UID:", user.uid);
            setUserRole(null); 
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user role from Firestore:", error);
          setUserRole(null); 
        }
      } else {
        // אם אין משתמש, אפס את התפקיד
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login, // הוספת פונקציית login ל-value
    logout, // הוספת פונקציית logout ל-value
    updatePassword, // הוספת פונקציית updatePassword ל-value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}