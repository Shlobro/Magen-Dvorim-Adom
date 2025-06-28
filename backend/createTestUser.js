import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./privateKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createTestUser() {
  try {
    // Create test user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: 'test-csv@example.com',
      password: '123456789',
      displayName: 'Test CSV User'
    });
    
    console.log('Created auth user:', userRecord.uid);
    
    // Create user in Firestore with requirePasswordChange
    await db.collection('user').doc(userRecord.uid).set({
      firstName: 'Test',
      lastName: 'CSV',
      email: 'test-csv@example.com',
      userType: 2,
      requirePasswordChange: true,
      createdAt: new Date().toISOString()
    });
    
    console.log('Created firestore user with requirePasswordChange: true');
    console.log('You can now try to login with:');
    console.log('Email: test-csv@example.com');
    console.log('Password: 123456789');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
