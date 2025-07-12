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
import { validateAddressGeocoding } from './geocoding';

// User Management
export const userService = {
  // Get user profile
  async getUserProfile(userId) {
    try {
      // Validate userId parameter
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        console.error('Invalid userId provided to getUserProfile:', userId);
        throw new Error('משתמש לא נמצא - מזהה לא תקין');
      }
      
      // Ensure userId is trimmed
      const cleanUserId = userId.trim();
      
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

  // Delete user completely (Firestore + Auth warning)
  async deleteUser(userId) {
    try {
      console.log(`🗑️ Deleting user: ${userId}`);
      
      // 1. Get user data before deletion (for logging)
      const userDoc = await getDoc(doc(db, 'user', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // 2. Delete user document from Firestore
      await deleteDoc(doc(db, 'user', userId));
      console.log(`✅ Deleted Firestore document for: ${userId}`);
      
      // 3. Check if this is the current user (can delete from Auth)
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        try {
          await deleteAuthUser(currentUser);
          console.log(`✅ Deleted Auth account for current user: ${userId}`);
          return { 
            success: true, 
            message: 'משתמש נמחק בהצלחה מהמערכת לחלוטין',
            completeDeletion: true
          };
        } catch (authError) {
          console.error(`⚠️ Could not delete Auth account for current user:`, authError);
        }
      }
      
      // 4. Log warning about incomplete deletion and provide cleanup instructions
      if (userData) {
        console.warn(`⚠️ WARNING: User ${userData.email} (${userId}) deleted from Firestore but Auth account remains!`);
        console.warn(`   This creates an orphaned Auth account that should be cleaned up manually.`);
        console.warn(`   📋 CLEANUP INSTRUCTIONS:`);
        console.warn(`   1. Go to Firebase Console > Authentication > Users`);
        console.warn(`   2. Search for: ${userData.email}`);
        console.warn(`   3. Delete the user manually`);
        console.warn(`   4. Or use Firebase CLI: firebase auth:delete ${userId}`);
      }
      
      return { 
        success: true, 
        message: 'משתמש נמחק מהמסד נתונים. חשבון ה-Authentication נותר פעיל ויש צורך בניקוי ידני.',
        completeDeletion: false,
        warning: 'לא ניתן למחוק את חשבון ה-Authentication מהצד הקליינט - יש צורך בניקוי ידני',
        cleanupInstructions: {
          email: userData?.email,
          uid: userId,
          steps: [
            'פתח Firebase Console > Authentication > Users',
            `חפש את: ${userData?.email || 'המשתמש'}`,
            'מחק את המשתמש ידנית',
            `או השתמש ב-CLI: firebase auth:delete ${userId}`
          ]
        }
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get all users (for admin)
  async getAllUsers() {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('❌ No authenticated user found');
        throw new Error('No authenticated user');
      }

      const usersRef = collection(db, 'user');
      const querySnapshot = await getDocs(usersRef);
      
      const usersList = [];
      
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      
      return usersList;
    } catch (error) {
      console.error('❌ Error fetching users from Firestore:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
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

  // Bulk create volunteers from Excel upload
  async bulkCreateVolunteers(volunteers) {
    try {
      console.log('🔥 Firebase Service: Bulk creating volunteers (frontend-only)... [VERSION 2025-07-12-FIXED]');
      console.log(`Processing ${volunteers.length} volunteers`);
      
      const results = {
        success: [],
        errors: [],
        duplicates: [],
        orphanedAuthCleaned: []
      };

      for (const volunteer of volunteers) {
        try {
          console.log(`🔄 Processing volunteer: ${volunteer.email}`);
          
          // 1. Check if user already exists in Firestore by email or phone
          const existingByEmail = await this.checkUserExists(volunteer.email);
          const existingByPhone = volunteer.phoneNumber ? 
            await this.checkUserExistsByPhone(volunteer.phoneNumber) : null;

          if (existingByEmail || existingByPhone) {
            console.log(`⚠️ Duplicate found in Firestore: ${volunteer.email}`);
            results.duplicates.push({
              email: volunteer.email,
              reason: existingByEmail ? 'אימייל קיים במערכת' : 'מספר טלפון קיים במערכת'
            });
            continue;
          }

          // 2. Check if email exists in Firebase Auth (orphaned auth account)
          let authUserExists = false;
          let userCredential = null;
          
          try {
            // Try to create auth user with default password
            const defaultPassword = '123456';
            userCredential = await createUserWithEmailAndPassword(auth, volunteer.email, defaultPassword);
            console.log(`✅ Created new Firebase Auth user: ${volunteer.email}`);
          } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
              authUserExists = true;
              console.log(`🧹 Found orphaned Auth account for: ${volunteer.email}`);
              
              // Since we can't delete other users' Auth accounts from frontend,
              // we'll report this as an error requiring manual cleanup
              console.error(`❌ Cannot import ${volunteer.email}: Auth account exists but not in Firestore`);
              console.error(`   This indicates an orphaned Auth account that needs manual cleanup`);
              console.error(`   Cleanup: Firebase Console > Authentication > Users > Delete ${volunteer.email}`);
              
              results.errors.push({
                email: volunteer.email,
                error: 'מתנדב זה הוסר בעבר אך חשבון ה-Authentication שלו נותר פעיל',
                details: 'המתנדב יכול להירשם שוב דרך הטופס הרגיל (לא דרך אקסל) ולאפס את הסיסמה אם צריך',
                cleanup: `אלטרנטיבה: מחק את ${volunteer.email} מ-Firebase Console > Authentication > Users ואז נסה שוב`
              });
              continue;
            } else {
              // Other auth error
              console.error(`❌ Failed to create Auth user for ${volunteer.email}:`, authError);
              results.errors.push({
                email: volunteer.email,
                error: `שגיאה ביצירת חשבון Authentication: ${authError.message}`
              });
              continue;
            }
          }

          // 3. Create the volunteer data
          const volunteerData = {
            firstName: volunteer.firstName || '',
            lastName: volunteer.lastName || '',
            email: volunteer.email,
            phoneNumber: volunteer.phoneNumber || '',
            idNumber: volunteer.idNumber || '',
            address: volunteer.address || '',
            city: volunteer.city || '',
            beeExperience: volunteer.beeExperience || false,
            beekeepingExperience: volunteer.beekeepingExperience || false,
            hasTraining: volunteer.hasTraining || false,
            heightPermit: volunteer.heightPermit || false,
            previousEvacuation: volunteer.previousEvacuation || false,
            signupDate: volunteer.signupDate || new Date(),
            userType: 2, // Force volunteer type
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            requirePasswordChange: true, // Force password change for Excel imports
            isExcelImported: true
          };

          // 4. Try to geocode the address for map display
          if (volunteer.address && volunteer.city) {
            try {
              console.log(`🗺️ Geocoding address for: ${volunteer.email}`);
              const geocodeResult = await validateAddressGeocoding(volunteer.address, volunteer.city);
              
              if (geocodeResult.isValid && geocodeResult.coordinates) {
                volunteerData.lat = geocodeResult.coordinates.lat;
                volunteerData.lng = geocodeResult.coordinates.lng;
                console.log(`✅ Geocoded: ${volunteer.email}`);
              }
            } catch (geocodeError) {
              console.log(`⚠️ Geocoding failed for: ${volunteer.email}`);
            }
          }

          // 5. Create Firestore document with correct UID
          if (userCredential && userCredential.user) {
            try {
              await setDoc(doc(db, 'user', userCredential.user.uid), volunteerData);
              console.log(`✅ Created Firestore document: ${volunteer.email}`);
              
              results.success.push({
                id: userCredential.user.uid,
                email: volunteer.email,
                name: `${volunteer.firstName || ''} ${volunteer.lastName || ''}`.trim()
              });
            } catch (firestoreError) {
              console.error(`❌ Failed to create Firestore document for ${volunteer.email}:`, firestoreError);
              results.errors.push({
                email: volunteer.email,
                error: `שגיאה ביצירת מסמך במסד הנתונים: ${firestoreError.message}`
              });
            }
          } else {
            console.error(`❌ No valid userCredential for ${volunteer.email}`);
            results.errors.push({
              email: volunteer.email,
              error: 'לא נוצר חשבון Authentication תקין'
            });
          }

        } catch (error) {
          console.error(`❌ Error processing volunteer: ${volunteer.email}`, error);
          results.errors.push({
            email: volunteer.email,
            error: error.message
          });
        }
      }

      // Log summary
      console.log('📊 Bulk create summary:');
      console.log(`✅ Successfully created: ${results.success.length}`);
      console.log(`⚠️ Duplicates skipped: ${results.duplicates.length}`);
      console.log(`❌ Errors: ${results.errors.length}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error in bulk create:', error);
      throw error;
    }
  },

  // Get all volunteers
  async getVolunteers() {
    try {
      const allUsers = await this.getAllUsers();
      const volunteers = allUsers.filter(user => user.userType === 2);
      return volunteers;
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      throw error;
    }
  },

  // Helper function to check if user exists by email
  async checkUserExists(email) {
    try {
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  },

  // Helper function to check if user exists by phone
  async checkUserExistsByPhone(phoneNumber) {
    try {
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user existence by phone:', error);
      return false;
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
      let inquiries = [];
      
      // Query for inquiries where assignedVolunteers is an array containing the volunteer ID
      try {
        const arrayQuery = query(
          collection(db, 'inquiry'),
          where('assignedVolunteers', 'array-contains', volunteerId)
        );
        
        const arraySnapshot = await getDocs(arrayQuery);
        arraySnapshot.forEach(doc => {
          inquiries.push({ id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.warn('Array query failed:', error.message);
      }
      
      // Query for inquiries where assignedVolunteers is a string equal to the volunteer ID (legacy format)
      try {
        const stringQuery = query(
          collection(db, 'inquiry'),
          where('assignedVolunteers', '==', volunteerId)
        );
        
        const stringSnapshot = await getDocs(stringQuery);
        stringSnapshot.forEach(doc => {
          const existingIds = inquiries.map(inq => inq.id);
          if (!existingIds.includes(doc.id)) {
            inquiries.push({ id: doc.id, ...doc.data() });
          }
        });
      } catch (error) {
        console.warn('String query failed:', error.message);
      }
      
      // Sort manually by createdAt
      if (inquiries.length > 0) {
        inquiries.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return bDate - aDate;
        });
      }
      
      return inquiries;
    } catch (error) {
      console.error('Error fetching volunteer inquiries:', error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  },

  // Create new inquiry
  async createInquiry(inquiryData, coordinatorId = null) {
    try {
      console.log('🔄 Creating inquiry with direct Firestore access...');
      console.log('  - Has coordinates:', !!(inquiryData.location?.latitude && inquiryData.location?.longitude));
      console.log('  - City/Address:', { city: inquiryData.city, address: inquiryData.address });
      console.log('  - Coordinator ID:', coordinatorId);
      
      // If a coordinator is creating this inquiry, assign ownership automatically
      if (coordinatorId) {
        inquiryData.coordinatorId = coordinatorId;
        console.log('🎯 Automatically assigning ownership to coordinator:', coordinatorId);
      }
      
      // Attempt client-side geocoding if no coordinates are provided
      if (!inquiryData.location && inquiryData.city && inquiryData.address) {
        console.log('⚠️ No coordinates provided - attempting client-side geocoding...');
        
        try {
          const { geocodeAddress } = await import('./geocoding');
          const fullAddress = `${inquiryData.address}, ${inquiryData.city}, ישראל`;
          const coords = await geocodeAddress(fullAddress);
          
          if (coords && coords.lat && coords.lng) {
            inquiryData.location = {
              latitude: coords.lat,
              longitude: coords.lng
            };
            console.log('✅ Client-side geocoding successful:', coords);
          } else {
            console.warn('⚠️ Client-side geocoding failed for:', fullAddress);
          }
        } catch (geocodingError) {
          console.error('❌ Client-side geocoding error:', geocodingError);
        }
      }
      
      const docRef = await addDoc(collection(db, 'inquiry'), {
        ...inquiryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      if (!inquiryData.location) {
        console.warn('⚠️ WARNING: Inquiry created without coordinates! ID:', docRef.id);
        console.warn('   This inquiry may not appear on the map until coordinates are manually added.');
      } else {
        console.log('✅ Inquiry created successfully with coordinates. ID:', docRef.id);
      }
      
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
