// frontend/src/services/firebaseService.js
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updatePassword,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { db, auth } from '../firebaseConfig';

// User Management
export const userService = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      console.log('getUserProfile called with userId:', userId);
      console.log('Type of userId:', typeof userId);
      console.log('userId length:', userId ? userId.length : 'undefined');
      
      // Validate userId parameter
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('Invalid userId provided to getUserProfile:', userId);
        throw new Error('משתמש לא נמצא - מזהה לא תקין');
      }
      
      // Ensure userId is trimmed
      const cleanUserId = userId.trim();
      console.log('Clean userId:', cleanUserId);
      
      const userDoc = await getDoc(doc(db, 'user', cleanUserId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      throw new Error('משתמש לא נמצא');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const userRef = doc(db, 'user', userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { message: 'הפרופיל עודכן בהצלחה' };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      // Check if auth is available
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      let userCredential;
      try {
        // Create Firebase Auth user
        userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password || '123456'
        );
      } catch (authError) {
        console.error('Firebase Auth error:', authError);
        // If auth fails, still try to create the user document
        // This allows the system to work even if auth has issues
        const randomId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userCredential = { user: { uid: randomId } };
      }
      
      // Create user document in Firestore
      const userDoc = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber || '',
        idNumber: userData.idNumber || '',
        city: userData.city || '',
        streetName: userData.streetName || '',
        houseNumber: userData.houseNumber || '',
        beeExperience: userData.beeExperience || false,
        beekeepingExperience: userData.beekeepingExperience || false,
        hasTraining: userData.hasTraining || false,
        heightPermit: userData.heightPermit || false,
        additionalDetails: userData.additionalDetails || '',
        organizationName: userData.organizationName || '',
        position: userData.position || '',
        userType: userData.userType || 2, // Default to volunteer
        approved: userData.approved || false, // Add approved field for coordinators
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        requirePasswordChange: userData.requirePasswordChange || false
      };

      // Use setDoc instead of updateDoc for new documents
      await setDoc(doc(db, 'user', userCredential.user.uid), userDoc);
      return { id: userCredential.user.uid, message: 'משתמש נוצר בהצלחה' };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'user', userId));
      
      // Note: Deleting from Firebase Auth requires admin privileges
      // For now, we'll just delete from Firestore
      return { message: 'משתמש נמחק בהצלחה' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get all users (for admin)
  async getAllUsers() {
    try {
      console.log('Firebase Service: Getting all users from Firestore...');
      const snapshot = await getDocs(collection(db, 'user'));
      const users = [];
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });
      console.log('Firebase Service: Retrieved', users.length, 'users');
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      });
      throw error;
    }
  },

  // Query nearby volunteers
  async queryNearbyVolunteers(lat, lng, radius = 20) {
    try {
      const volunteersQuery = query(
        collection(db, 'user'),
        where('userType', '==', 2)
      );
      
      const snapshot = await getDocs(volunteersQuery);
      const volunteers = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lat && data.lng) {
          const distance = calculateDistance(lat, lng, data.lat, data.lng);
          if (distance <= radius) {
            volunteers.push({
              id: doc.id,
              name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
              lat: data.lat,
              lng: data.lng,
              distance: distance,
              beeExperience: data.beeExperience,
              beekeepingExperience: data.beekeepingExperience,
              hasTraining: data.hasTraining,
              heightPermit: data.heightPermit,
            });
          }
        }
      });
      
      // Sort by distance
      volunteers.sort((a, b) => a.distance - b.distance);
      return volunteers;
    } catch (error) {
      console.error('Error querying nearby volunteers:', error);
      throw error;
    }
  },

  // Update password change status
  async updatePasswordChanged(userId) {
    try {
      await updateDoc(doc(db, 'user', userId), {
        requirePasswordChange: false,
        passwordLastChanged: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, message: 'Password change requirement updated' };
    } catch (error) {
      console.error('Error updating password status:', error);
      throw error;
    }
  },

  // Create volunteer specifically
  async createVolunteer(volunteerData) {
    return await this.createUser({
      ...volunteerData,
      userType: 2 // Force volunteer type
    });
  },

  // Get all volunteers
  async getVolunteers() {
    try {
      const volunteersQuery = query(
        collection(db, 'user'),
        where('userType', '==', 2)
      );
      
      const snapshot = await getDocs(volunteersQuery);
      const volunteers = [];
      
      snapshot.forEach(doc => {
        volunteers.push({ id: doc.id, ...doc.data() });
      });
      
      return volunteers;
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      throw error;
    }
  }
};

// Inquiry Management
export const inquiryService = {
  // Get all inquiries
  async getInquiries(coordinatorId = null) {
    try {
      let inquiryQuery;
      
      if (coordinatorId) {
        // Try the complex query first, fall back to simple query if index doesn't exist
        try {
          inquiryQuery = query(
            collection(db, 'inquiry'),
            where('coordinatorId', '==', coordinatorId),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(inquiryQuery);
          const inquiries = [];
          snapshot.forEach(doc => {
            inquiries.push({ id: doc.id, ...doc.data() });
          });
          return inquiries;
        } catch (indexError) {
          console.warn('Composite index not available, using simple query:', indexError.message);
          // Fallback to simple query without ordering
          inquiryQuery = query(
            collection(db, 'inquiry'),
            where('coordinatorId', '==', coordinatorId)
          );
        }
      } else {
        inquiryQuery = query(
          collection(db, 'inquiry'),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(inquiryQuery);
      const inquiries = [];
      snapshot.forEach(doc => {
        inquiries.push({ id: doc.id, ...doc.data() });
      });
      
      // If we used the fallback query, sort manually
      if (coordinatorId && inquiries.length > 0) {
        inquiries.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate - aDate;
        });
      }
      
      return inquiries;
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  },

  // Get volunteer inquiries
  async getVolunteerInquiries(volunteerId) {
    try {
      const inquiryQuery = query(
        collection(db, 'inquiry'),
        where('assignedVolunteers', 'array-contains', volunteerId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(inquiryQuery);
      const inquiries = [];
      snapshot.forEach(doc => {
        inquiries.push({ id: doc.id, ...doc.data() });
      });
      
      return inquiries;
    } catch (error) {
      console.error('Error fetching volunteer inquiries:', error);
      throw error;
    }
  },

  // Create new inquiry
  async createInquiry(inquiryData) {
    try {
      const docRef = await addDoc(collection(db, 'inquiry'), {
        ...inquiryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, message: 'פנייה נוצרה בהצלחה' };
    } catch (error) {
      console.error('Error creating inquiry:', error);
      throw error;
    }
  },

  // Update inquiry status
  async updateInquiryStatus(inquiryId, status, closureReason = null, coordinatorId = null) {
    try {
      const updateData = { 
        status,
        updatedAt: serverTimestamp()
      };
      
      if (closureReason) {
        updateData.closureReason = closureReason;
      }
      
      if (coordinatorId) {
        updateData.coordinatorId = coordinatorId;
      }
      
      await updateDoc(doc(db, 'inquiry', inquiryId), updateData);
      return { message: 'סטטוס פנייה עודכן' };
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      throw error;
    }
  },

  // Take ownership of inquiry
  async takeOwnership(inquiryId, coordinatorId) {
    try {
      await updateDoc(doc(db, 'inquiry', inquiryId), {
        coordinatorId: coordinatorId,
        updatedAt: serverTimestamp()
      });
      return { message: 'הפנייה נלקחה לטיפול' };
    } catch (error) {
      console.error('Error taking ownership:', error);
      throw error;
    }
  },

  // Release ownership
  async releaseOwnership(inquiryId) {
    try {
      await updateDoc(doc(db, 'inquiry', inquiryId), {
        coordinatorId: null,
        updatedAt: serverTimestamp()
      });
      return { message: 'הפנייה שוחררה מטיפול' };
    } catch (error) {
      console.error('Error releasing ownership:', error);
      throw error;
    }
  },

  // Reassign volunteer
  async reassignVolunteer(inquiryId, newVolunteerId) {
    try {
      await updateDoc(doc(db, 'inquiry', inquiryId), {
        assignedVolunteers: [newVolunteerId],
        updatedAt: serverTimestamp()
      });
      return { message: 'מתנדב הוקצה מחדש בהצלחה' };
    } catch (error) {
      console.error('Error reassigning volunteer:', error);
      throw error;
    }
  }
};

// Auth Service
export const authService = {
  // Sign in
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      await updatePassword(user, newPassword);
      return { message: 'סיסמה שונתה בהצלחה' };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
