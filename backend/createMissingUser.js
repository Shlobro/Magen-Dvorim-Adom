// Script to create missing user document for volunteer
import db from './services/firebaseAdmin.js';

const userId = 'W2QTTOShILYlq7Cm63VMWmop09h2';

async function createMissingUser() {
  try {
    console.log('🔧 Creating missing user document...');
    console.log('User ID:', userId);
    
    // Create a basic volunteer user document
    const userData = {
      uid: userId,
      firstName: 'משתמש',
      lastName: 'מתנדב',
      name: 'משתמש מתנדב',
      email: 'volunteer@example.com', // Will need to be updated with actual email
      phoneNumber: '050-0000000',
      city: 'תל אביב',
      streetName: 'רחוב הראשי',
      houseNumber: '1',
      address: 'רחוב הראשי 1',
      idNumber: '000000000',
      beeExperience: false,
      beekeepingExperience: false,
      hasTraining: false,
      heightPermit: false,
      additionalDetails: 'משתמש שנוצר ידנית - יש לעדכן פרטים',
      userType: 2, // Volunteer
      createdAt: new Date().toISOString(),
      signupDate: new Date().toLocaleDateString('he-IL'),
      lat: 32.0853, // Tel Aviv coordinates
      lng: 34.7818,
      agreedToEthics: true,
      isActive: true,
      requirePasswordChange: false
    };

    await db.collection('user').doc(userId).set(userData);
    
    console.log('✅ User document created successfully!');
    console.log('Created user data:', JSON.stringify(userData, null, 2));
    
    // Verify the creation
    const userDocRef = db.collection('user').doc(userId);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      console.log('✅ Verification: User document found after creation');
    } else {
      console.log('❌ Verification: User document NOT found after creation');
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

createMissingUser();
