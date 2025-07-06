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
  return await inquiryService.createInquiry(inquiry);
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