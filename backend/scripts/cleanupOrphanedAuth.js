/**
 * Admin Script for Cleaning Up Orphaned Firebase Auth Accounts
 * 
 * This script should be run periodically (weekly/monthly) to clean up
 * Firebase Authentication accounts that no longer have corresponding
 * Firestore user documents.
 * 
 * Usage:
 * 1. Run this in Firebase Functions Emulator (free)
 * 2. Or run locally with Firebase Admin SDK
 * 3. Or manually use Firebase Console
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (add your service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./privateKey.json'))
  });
}

async function cleanupOrphanedAuthAccounts() {
  console.log('🧹 Starting cleanup of orphaned Firebase Auth accounts...');
  
  const auth = admin.auth();
  const firestore = admin.firestore();
  
  let cleanedCount = 0;
  let totalChecked = 0;
  const orphanedAccounts = [];
  
  try {
    // Get all Auth users
    let listUsersResult = await auth.listUsers();
    
    do {
      for (const userRecord of listUsersResult.users) {
        totalChecked++;
        
        try {
          // Check if user exists in Firestore
          const userDoc = await firestore.collection('users').doc(userRecord.uid).get();
          
          if (!userDoc.exists) {
            // This is an orphaned Auth account
            orphanedAccounts.push({
              uid: userRecord.uid,
              email: userRecord.email,
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime
            });
            
            console.log(`🗑️ Found orphaned Auth account: ${userRecord.email} (${userRecord.uid})`);
            
            // Delete the orphaned Auth account
            await auth.deleteUser(userRecord.uid);
            cleanedCount++;
            
            console.log(`✅ Deleted orphaned Auth account: ${userRecord.email}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing user ${userRecord.uid}:`, error.message);
        }
      }
      
      // Get next batch if there are more users
      if (listUsersResult.pageToken) {
        listUsersResult = await auth.listUsers(1000, listUsersResult.pageToken);
      } else {
        break;
      }
      
    } while (listUsersResult.users.length > 0);
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total Auth accounts checked: ${totalChecked}`);
    console.log(`   Orphaned accounts found: ${orphanedAccounts.length}`);
    console.log(`   Accounts cleaned up: ${cleanedCount}`);
    
    if (orphanedAccounts.length > 0) {
      console.log('\n🗑️ Cleaned up accounts:');
      orphanedAccounts.forEach(account => {
        console.log(`   - ${account.email} (${account.uid})`);
      });
    }
    
    return {
      success: true,
      totalChecked,
      orphanedFound: orphanedAccounts.length,
      cleanedUp: cleanedCount,
      orphanedAccounts
    };
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { cleanupOrphanedAuthAccounts };

// Run directly if this file is executed
if (require.main === module) {
  cleanupOrphanedAuthAccounts()
    .then(result => {
      console.log('\n✅ Cleanup completed successfully!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}
