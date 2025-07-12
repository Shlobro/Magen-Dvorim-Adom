// Script to delete orphaned users (no Auth account)
import db from './services/firebaseAdmin.js';

async function deleteOrphanedUsers() {
  try {
    console.log('🗑️ Deleting orphaned users...');
    
    // The orphaned user we identified
    const orphanedUsers = [
      'user_1752270109424_sgsi9maca' // Besttsellers@gmail.com
    ];
    
    for (const orphanedId of orphanedUsers) {
      try {
        const docRef = db.collection('user').doc(orphanedId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const userData = docSnap.data();
          console.log(`🗑️ Deleting orphaned user: ${userData.email} (${orphanedId})`);
          await docRef.delete();
          console.log(`✅ Deleted: ${userData.email}`);
        } else {
          console.log(`⚠️ Document not found: ${orphanedId}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${orphanedId}:`, error);
      }
    }
    
    console.log('🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

deleteOrphanedUsers();
