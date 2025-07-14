// Check coordinator assignments for existing inquiries
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';

async function checkInquiryCoordinators() {
  console.log('🔍 Checking coordinator assignments...');
  
  try {
    const inquiriesRef = collection(db, 'inquiry');
    const querySnapshot = await getDocs(inquiriesRef);
    
    console.log(`📋 Found ${querySnapshot.docs.length} total inquiries`);
    
    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      console.log(`📍 Inquiry ${docSnap.id}:`);
      console.log(`   coordinatorId: ${data.coordinatorId || 'NONE'} (type: ${typeof data.coordinatorId})`);
      console.log(`   status: ${data.status}`);
      console.log(`   address: ${data.address}`);
      
      // Special check for the released inquiry
      if (docSnap.id === 'gfpdYxaK0zYleNlz8o7j') {
        console.log(`   🔍 RELEASED INQUIRY DETAILS:`);
        console.log(`   - coordinatorId value: "${data.coordinatorId}"`);
        console.log(`   - coordinatorId is null: ${data.coordinatorId === null}`);
        console.log(`   - coordinatorId is undefined: ${data.coordinatorId === undefined}`);
        console.log(`   - coordinatorId is empty string: ${data.coordinatorId === ''}`);
        console.log(`   - all fields:`, Object.keys(data));
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkInquiryCoordinators().then(() => {
  console.log('🏁 Check completed');
  process.exit(0);
});
