// Manual release of inquiry gfpdYxaK0zYleNlz8o7j
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';

async function manualReleaseInquiry() {
  console.log('🔧 Manually releasing inquiry gfpdYxaK0zYleNlz8o7j...');
  
  try {
    const inquiryRef = doc(db, 'inquiry', 'gfpdYxaK0zYleNlz8o7j');
    await updateDoc(inquiryRef, {
      coordinatorId: null,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Successfully released inquiry gfpdYxaK0zYleNlz8o7j');
    console.log('   coordinatorId is now null');
    
  } catch (error) {
    console.error('❌ Error releasing inquiry:', error);
  }
}

manualReleaseInquiry().then(() => {
  console.log('🏁 Manual release completed');
  process.exit(0);
});
