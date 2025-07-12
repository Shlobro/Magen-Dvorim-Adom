// Script to fix users with wrong Firestore document IDs
import db from './services/firebaseAdmin.js';
import admin from 'firebase-admin';

async function fixUsersWithWrongIds() {
  try {
    console.log('🔧 Starting fix for users with wrong Firestore IDs...');
    
    // The users we identified that need fixing
    const usersToFix = [
      {
        email: 'niroprotech1@gmail.com',
        wrongId: 'user_1752270110745_nd0u92hbx',
        correctId: 'hD7lqbPlayMtIiK9KVDe94yeyp03'
      },
      {
        email: 'publicityonly@gmail.com', 
        wrongId: 'user_1752270111938_31007lfgh',
        correctId: 'W2QTTOShILYlq7Cm63VMWmop09h2'
      }
    ];
    
    for (const user of usersToFix) {
      console.log(`\n🔄 Fixing user: ${user.email}`);
      console.log(`  Wrong ID: ${user.wrongId}`);
      console.log(`  Correct ID: ${user.correctId}`);
      
      try {
        // 1. Get the user data from the wrong document
        const wrongDocRef = db.collection('user').doc(user.wrongId);
        const wrongDocSnap = await wrongDocRef.get();
        
        if (!wrongDocSnap.exists) {
          console.log(`❌ Wrong document not found: ${user.wrongId}`);
          continue;
        }
        
        const userData = wrongDocSnap.data();
        console.log(`✅ Retrieved user data for ${user.email}`);
        
        // 2. Check if correct document already exists
        const correctDocRef = db.collection('user').doc(user.correctId);
        const correctDocSnap = await correctDocRef.get();
        
        if (correctDocSnap.exists) {
          console.log(`⚠️ Correct document already exists for ${user.correctId}`);
          console.log(`   This might be the manually created document. Merging data...`);
          
          // Merge the data, giving priority to the Excel data (more complete)
          const existingData = correctDocSnap.data();
          const mergedData = {
            ...existingData, // Keep any manually added data
            ...userData,     // Override with Excel data
            // Keep some manually set flags if they exist
            isActive: existingData.isActive !== undefined ? existingData.isActive : userData.isActive,
            createdAt: existingData.createdAt || userData.createdAt,
            updatedAt: new Date()
          };
          
          await correctDocRef.set(mergedData);
          console.log(`✅ Merged data into correct document: ${user.correctId}`);
        } else {
          // 3. Create the correct document with the user data
          await correctDocRef.set(userData);
          console.log(`✅ Created correct document: ${user.correctId}`);
        }
        
        // 4. Delete the wrong document
        await wrongDocRef.delete();
        console.log(`🗑️ Deleted wrong document: ${user.wrongId}`);
        
        console.log(`✅ Successfully fixed user: ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Error fixing user ${user.email}:`, error);
      }
    }
    
    console.log('\n🎉 Fix process completed!');
    console.log('Users should now be able to log in and see their proper roles.');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  }
}

fixUsersWithWrongIds();
