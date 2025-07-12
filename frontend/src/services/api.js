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

export const saveInquiry = async (inquiry) => {
  try {
    // Determine the correct backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                      (import.meta.env.PROD ? 'https://magen-dvorim-adom-backend.railway.app' : 'http://localhost:3000');
    
    console.log('🔄 Saving inquiry via backend API with geocoding...');
    console.log('  - Backend URL:', backendUrl);
    console.log('  - Inquiry data:', { 
      city: inquiry.city, 
      address: inquiry.address,
      hasCoordinates: !!(inquiry.lat && inquiry.lng) 
    });
    
    // Use backend API to ensure geocoding is applied
    const response = await fetch(`${backendUrl}/inquiry/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiry)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);
      throw new Error(`Backend error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Inquiry saved successfully via backend with coordinates');
    return { id: result.inquiryId, message: result.message };
    
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
          console.warn('⚠️ Client-side geocoding failed - inquiry will be saved without coordinates');
        }
      }
      
      // Fallback to direct Firestore creation
      console.log('🔄 Using direct Firestore creation as fallback...');
      const result = await inquiryService.createInquiry(inquiry);
      
      if (!inquiry.location) {
        console.warn('⚠️ WARNING: Inquiry saved without coordinates! Manual geocoding may be needed.');
      }
      
      return result;
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(`Failed to save inquiry: ${error.message}. Fallback error: ${fallbackError.message}`);
    }
  }
};

export const uploadPhoto = async (inquiryId, file) => {
  try {
    // Create a reference to the file in Firebase Storage
    const fileName = `inquiry-photos/${inquiryId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { data: { photoUrl: downloadURL } };
  } catch (error) {
    console.error('Error uploading photo:', error);
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