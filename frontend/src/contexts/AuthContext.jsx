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
import { doc, getDoc, updateDoc, collection, getDocs, setDoc } from 'firebase/firestore'; 

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
      console.log('updateUserPassword: Starting password update process');
      console.log('updateUserPassword: Current user email:', currentUser.email);
      
      // יצירת credential עבור הסיסמה הנוכחית
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      console.log('updateUserPassword: Created credential for email:', currentUser.email);
      
      // re-authenticate המשתמש עם הסיסמה הנוכחית
      console.log('updateUserPassword: Attempting to reauthenticate user...');
      await reauthenticateWithCredential(currentUser, credential);
      console.log('updateUserPassword: Reauthentication successful');
      
      // עדכון הסיסמה החדשה
      console.log('updateUserPassword: Attempting to update password...');
      await updatePassword(currentUser, newPassword);
      console.log('updateUserPassword: Password updated successfully');
      
    } catch (error) {
      console.error("updateUserPassword: Error occurred:", error);
      console.error("updateUserPassword: Error code:", error.code);
      console.error("updateUserPassword: Error message:", error.message);
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

  // Function to create missing user document
  const createMissingUserDocument = async (user) => {
    try {
      // Create a basic user document with default volunteer settings
      const userDocData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0], // Use display name or email prefix
        firstName: user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0],
        lastName: user.displayName ? user.displayName.split(' ')[1] || '' : '',
        userType: 2, // Default to volunteer (2)
        createdAt: new Date().toISOString(),
        signupDate: new Date().toLocaleDateString('he-IL'),
        isActive: true,
        // Add some default fields for volunteers
        phoneNumber: '',
        city: '',
        streetName: '',
        houseNumber: '',
        address: '',
        idNumber: '',
        beeExperience: false,
        beekeepingExperience: false,
        hasTraining: false,
        heightPermit: false,
        additionalDetails: 'חשבון נוצר אוטומטית - יש לעדכן פרטים',
        lat: 0,
        lng: 0,
        agreedToEthics: true
      };
      
      const userDocRef = doc(db, 'user', user.uid);
      await setDoc(userDocRef, userDocData);
      
      // Update local state
      setUserData(userDocData);
      setUserRole(userDocData.userType);
      
      return userDocData;
    } catch (error) {
      console.error("Error creating missing user document:", error);
      throw error;
    }
  };

  // פונקציה לרענון נתוני המשתמש מ-Firestore
  const refreshUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'user', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const freshUserData = userDocSnap.data();
        setUserData(freshUserData);
        setUserRole(freshUserData.userType);
        console.log("User data refreshed successfully");
        return freshUserData;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
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
          } else {
            console.log("AuthContext: No user data found in 'user' collection for UID:", user.uid);
            
            // Automatically create missing user document
            try {
              await createMissingUserDocument(user);
              console.log("AuthContext: Successfully created missing user document");
            } catch (createError) {
              console.error("AuthContext: Failed to create missing user document:", createError);
              setUserRole(null);
              setUserData(null);
            }
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
    refreshUserData, // הוספת פונקציית refreshUserData ל-value

  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}