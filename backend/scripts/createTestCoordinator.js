// backend/scripts/createTestCoordinator.js
import { admin } from '../services/firebaseAdmin.js';

async function createCoordinator() {
  const email = 'test@test.com';
  const password = '123456';
  const displayName = 'Test Coordinator';

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
      disabled: false
    });
    console.log('✅ Coordinator created in Auth:', userRecord.uid);

    // Add coordinator profile to Firestore in 'user' collection
    const coordinatorData = {
      uid: userRecord.uid,
      email,
      name: displayName,
      firstName: 'Test',
      lastName: 'Coordinator',
      userType: 1, // 1 = Coordinator, 2 = Volunteer
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      signupDate: new Date().toLocaleDateString('he-IL'),
      isActive: true,
      approved: true,
      // Required fields for coordinators
      phoneNumber: '+972-50-000-0000',
      city: 'תל אביב',
      streetName: 'רחוב הבדיקה',
      houseNumber: '1',
      address: 'רחוב הבדיקה 1',
      idNumber: '123456789',
      lat: 32.0853,
      lng: 34.7818,
      agreedToEthics: true
    };
    
    // Add to 'user' collection (main collection used by the app)
    await admin.firestore().collection('user').doc(userRecord.uid).set(coordinatorData);
    console.log('✅ Coordinator profile added to user collection:', coordinatorData);
    
    // Also add to 'coordinators' collection if needed for approvals
    const coordinatorApprovalData = {
      uid: userRecord.uid,
      email,
      displayName,
      role: 'coordinator',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      approved: true
    };
    await admin.firestore().collection('coordinators').doc(userRecord.uid).set(coordinatorApprovalData);
    console.log('✅ Coordinator also added to coordinators collection for approvals');
  } catch (error) {
    console.error('❌ Error creating coordinator:', error);
  }
}

createCoordinator();
