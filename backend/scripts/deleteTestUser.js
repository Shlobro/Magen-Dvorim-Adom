// backend/scripts/deleteTestUser.js
import { admin } from '../services/firebaseAdmin.js';

async function deleteTestUser() {
  const email = 'test@test.com';
  
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('Found user:', userRecord.uid);
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(userRecord.uid);
    console.log('✅ User deleted from Auth');
    
    // Delete from Firestore collections
    await admin.firestore().collection('user').doc(userRecord.uid).delete();
    console.log('✅ User deleted from user collection');
    
    await admin.firestore().collection('coordinators').doc(userRecord.uid).delete();
    console.log('✅ User deleted from coordinators collection');
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
}

deleteTestUser();
