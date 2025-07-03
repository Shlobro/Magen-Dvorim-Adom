// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig'; 
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  updatePassword, 
  reauthenticateWithCredential,
  EmailAuthProvider 
} from 'firebase/auth'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [userData, setUserData] = useState(null);
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
  const updateUserPassword = async (currentPassword, newPassword) => {
    if (!currentUser) {
      throw new Error('אין משתמש מחובר');
    }

    try {
      // יצירת credential עבור הסיסמה הנוכחית
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      
      // re-authenticate המשתמש עם הסיסמה הנוכחית
      await reauthenticateWithCredential(currentUser, credential);
      
      // עדכון הסיסמה החדשה
      await updatePassword(currentUser, newPassword);
      
      console.log("Password updated successfully");
    } catch (error) {
      console.error("AuthContext: Password update error:", error);
      throw error;
    }
  };

  // פונקציית עדכון נתוני משתמש ב-Firestore
  const updateUserData = async (uid, updates) => {
    try {
      const userDocRef = doc(db, 'user', uid);
      await updateDoc(userDocRef, updates);
      
      // עדכון הנתונים המקומיים
      if (uid === currentUser?.uid) {
        setUserData(prev => ({ ...prev, ...updates }));
      }
      
      console.log("User data updated successfully");
    } catch (error) {
      console.error("AuthContext: User data update error:", error);
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
            const userDataFromFirestore = userDocSnap.data();
            setUserRole(userDataFromFirestore.userType);
            setUserData(userDataFromFirestore);
            console.log("AuthContext: User data loaded:", userDataFromFirestore);
            console.log("AuthContext: User Type:", userDataFromFirestore.userType);
          } else {
            console.log("AuthContext: No user data found in 'user' collection for UID:", user.uid);
            setUserRole(null);
            setUserData(null);
          }
        } catch (error) {
          console.error("AuthContext: Error fetching user role from Firestore:", error);
          setUserRole(null);
          setUserData(null);
        }
      } else {
        // אם אין משתמש, אפס את התפקיד והנתונים
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    setUserData,
    loading,
    login, // הוספת פונקציית login ל-value
    logout, // הוספת פונקציית logout ל-value
    updateUserPassword,
    updateUserData,

  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}