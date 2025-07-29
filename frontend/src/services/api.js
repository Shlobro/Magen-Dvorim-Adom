// frontend/src/services/api.js
import { userService, inquiryService } from './firebaseService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateDoc, doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';

export const getUser = async (id) => {
  return await userService.getUserProfile(id);
};

export const saveUser = async (user) => {
  return await userService.createUser(user);
};

export const saveInquiry = async (inquiry, coordinatorId = null) => {
  try {
    // If a coordinator is creating this inquiry, add coordinatorId
    if (coordinatorId) {
      inquiry.coordinatorId = coordinatorId;
      console.log('🎯 Assigning ownership to coordinator:', coordinatorId);
    }

    // Determine the correct backend URL - prioritize production detection
    const backendUrl = import.meta.env.PROD 
      ? (import.meta.env.VITE_API_BASE || 'https://magendovrimadom-backend.railway.app')
      : (import.meta.env.VITE_API_BASE || 'http://localhost:3001');
    
    console.log('🌐 Using backend URL:', backendUrl);
    console.log('🔄 Sending inquiry to backend for geocoding...');

    const response = await fetch(`${backendUrl}/inquiry/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiry),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Backend inquiry creation successful:', result);
    
    if (!result.coordinates) {
      console.warn('⚠️ No coordinates returned from backend geocoding');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error saving inquiry via backend:', error);
    
    // Enhanced fallback with client-side geocoding attempt
    console.log('🔄 Attempting fallback with client-side geocoding...');
    
    try {
      // Try to add coordinates using frontend geocoding service
      if (inquiry.city && inquiry.address && !inquiry.location) {
        const { geocodeAddress } = await import('./geocoding');
        const fullAddress = `${inquiry.address}, ${inquiry.city}, ישראל`;
        console.log('📍 Attempting client-side geocoding for:', fullAddress);
        
        const coords = await geocodeAddress(fullAddress);
        if (coords && coords.lat && coords.lng) {
          inquiry.location = {
            latitude: coords.lat,
            longitude: coords.lng
          };
          console.log('✅ Client-side geocoding successful:', coords);
        } else {
          console.error('❌ Client-side geocoding also failed');
          throw new Error('לא ניתן לאתר את הכתובת במפה. אנא ודא שהכתובת מדויקת ותכלול גם את העיר.');
        }
      }
      
      // Fallback to direct Firestore creation only if we have coordinates
      console.log('🔄 Using direct Firestore creation as fallback...');
      const result = await inquiryService.createInquiry(inquiry, coordinatorId);
      
      return result;
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(fallbackError.message || `Failed to save inquiry: ${error.message}. Fallback error: ${fallbackError.message}`);
    }
  }
};

export const uploadPhoto = async (inquiryId, file, photoType = 'single') => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    console.log(`📸 Uploading ${photoType} photo for inquiry: ${inquiryId}`);
    console.log(`📁 File details:`, {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Create a reference to the file in Firebase Storage
    const fileName = `inquiry-photos/${inquiryId}/${photoType}_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('✅ File uploaded to Firebase Storage');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL obtained:', downloadURL);
    
    // Update the inquiry document in Firestore with the photo URL
    if (db) {
      const updateData = {};
      if (photoType === 'entry') {
        updateData.entryPhoto = downloadURL;
        updateData.entryPhotoUploadedAt = serverTimestamp();
      } else if (photoType === 'exit') {
        updateData.exitPhoto = downloadURL;
        updateData.exitPhotoUploadedAt = serverTimestamp();
      } else {
        // Backward compatibility for single photo
        updateData.photo = downloadURL;
        updateData.photoUploadedAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, 'inquiry', inquiryId), updateData);
      console.log(`✅ Inquiry document updated with ${photoType} photo URL`);
    }
    
    return { data: { photoUrl: downloadURL } };
    
  } catch (error) {
    console.error(`❌ Error uploading ${photoType} photo to Firebase Storage:`, error);
    throw error;
  }
};

export const linkUserToInquiry = async (link) => {
  try {
    await updateDoc(doc(db, 'inquiry', link.inquiryId), {
      assignedVolunteers: arrayUnion(link.userId),
      updatedAt: serverTimestamp()
    });
    return { message: 'מתנדב קושר לפנייה בהצלחה' };
  } catch (error) {
    console.error('Error linking user to inquiry:', error);
    throw error;
  }
};

export const queryUsers = async (filters) => {
  return await userService.getAllUsers(); // Can be enhanced with filters if needed
};