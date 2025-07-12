// Script to check if user exists in Firestore
import db from './services/firebaseAdmin.js';

const userId = 'W2QTTOShILYlq7Cm63VMWmop09h2';

async function checkUser() {
  try {
    console.log('🔍 Checking user in Firestore...');
    console.log('User ID:', userId);
    
    // Check in 'user' collection
    const userDocRef = db.collection('user').doc(userId);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
      const userData = userDocSnap.data();
      console.log('✅ User found in "user" collection:');
      console.log('User Type:', userData.userType);
      console.log('Name:', userData.name);
      console.log('Email:', userData.email);
      console.log('Full user data:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ User NOT found in "user" collection');
      
      // Let's check if there are any users in the collection
      const allUsersSnapshot = await db.collection('user').get();
      console.log(`📊 Total users in collection: ${allUsersSnapshot.size}`);
      
      console.log('All users:');
      allUsersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}, Type: ${data.userType}, Name: ${data.name || data.firstName + ' ' + data.lastName}, Email: ${data.email}`);
      });
    }
    
    // Also check if there are any other collections that might contain user data
    const collections = await db.listCollections();
    console.log('\n📋 Available collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

checkUser();
