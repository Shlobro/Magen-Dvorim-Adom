// Script to clean up orphaned users and fix Excel import issues
import db from './services/firebaseAdmin.js';
import admin from 'firebase-admin';

async function cleanupOrphanedUsers() {
  try {
    console.log('🧹 Starting cleanup of orphaned users...');
    
    // Get all users from Firestore
    const allUsersSnapshot = await db.collection('user').get();
    console.log(`📊 Total users in Firestore: ${allUsersSnapshot.size}`);
    
    // Get all users from Firebase Auth
    const authUsers = [];
    const listAllUsers = async (nextPageToken) => {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      authUsers.push(...listUsersResult.users);
      if (listUsersResult.pageToken) {
        await listAllUsers(listUsersResult.pageToken);
      }
    };
    
    await listAllUsers();
    console.log(`📊 Total users in Firebase Auth: ${authUsers.length}`);
    
    // Create a map of Auth users by email
    const authUsersByEmail = {};
    authUsers.forEach(user => {
      if (user.email) {
        authUsersByEmail[user.email] = user;
      }
    });
    
    const orphanedUsers = [];
    const validUsers = [];
    const usersToFix = [];
    
    // Check each Firestore user
    allUsersSnapshot.forEach(doc => {
      const userData = doc.data();
      const firestoreId = doc.id;
      
      // Check if this is a generated ID (Excel import issue)
      if (firestoreId.startsWith('user_') && firestoreId.includes('_')) {
        console.log(`🔍 Found generated ID: ${firestoreId} (${userData.email})`);
        
        // Check if there's a corresponding Auth user
        const authUser = authUsersByEmail[userData.email];
        if (authUser) {
          console.log(`✅ Auth user exists for ${userData.email}: ${authUser.uid}`);
          usersToFix.push({
            firestoreId,
            correctId: authUser.uid,
            email: userData.email,
            userData
          });
        } else {
          console.log(`❌ No Auth user for ${userData.email}`);
          orphanedUsers.push({
            firestoreId,
            email: userData.email,
            userData
          });
        }
      } else {
        // This is a proper Firebase Auth UID
        validUsers.push({
          firestoreId,
          email: userData.email,
          userData
        });
      }
    });
    
    console.log('\n📋 Cleanup Summary:');
    console.log(`✅ Valid users (proper UID): ${validUsers.length}`);
    console.log(`🔧 Users to fix (wrong UID): ${usersToFix.length}`);
    console.log(`🗑️ Orphaned users (no Auth): ${orphanedUsers.length}`);
    
    if (usersToFix.length > 0) {
      console.log('\n🔧 Users that need fixing:');
      usersToFix.forEach(user => {
        console.log(`- ${user.email}: ${user.firestoreId} → ${user.correctId}`);
      });
      
      console.log('\nTo fix these users, run the fix script...');
    }
    
    if (orphanedUsers.length > 0) {
      console.log('\n🗑️ Orphaned users (consider deleting):');
      orphanedUsers.forEach(user => {
        console.log(`- ${user.email}: ${user.firestoreId}`);
      });
    }
    
    return {
      validUsers,
      usersToFix,
      orphanedUsers
    };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupOrphanedUsers();
