// backend/scripts/cleanupOrphanedUsers.js
import admin from 'firebase-admin';
import db from '../services/firebaseAdmin.js';

async function cleanupOrphanedUsers() {
  try {
    console.log('Starting cleanup of orphaned Firebase Auth users...');
    
    // Get all Firebase Auth users
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;
    
    console.log(`Found ${authUsers.length} Firebase Auth users`);
    
    // Check each auth user to see if they have a Firestore document
    for (const authUser of authUsers) {
      try {
        const userDoc = await db.collection('user').doc(authUser.uid).get();
          if (!userDoc.exists) {
          console.log(`Orphaned user found: ${authUser.email} (UID: ${authUser.uid})`);
          
          // Delete the orphaned user
          await admin.auth().deleteUser(authUser.uid);
          console.log(`✅ Deleted orphaned user: ${authUser.email}`);
        } else {
          console.log(`✅ Valid user: ${authUser.email}`);
        }
      } catch (error) {
        console.error(`Error checking user ${authUser.email}:`, error);
      }
    }
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupOrphanedUsers();
