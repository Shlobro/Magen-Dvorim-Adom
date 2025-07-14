// Create test inquiries in the new database
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';

const testInquiries = [
  {
    fullName: "יוסי כהן",
    phoneNumber: "050-1234567",
    city: "תל אביב",
    address: "דיזנגוף 1",
    heightFloor: "קרקע",
    additionalDetails: "נחיל קטן על עץ",
    status: "נפתחה פנייה (טופס מולא)",
    date: new Date().toLocaleDateString('he-IL'),
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    lat: 32.0853, // Tel Aviv coordinates
    lng: 34.7818,
    coordinatorId: "3un80ldBwNORf4NpYGOPd76iyIl1", // Your coordinator ID
    createdAt: serverTimestamp()
  },
  {
    fullName: "רחל לוי",
    phoneNumber: "052-9876543",
    city: "ירושלים",
    address: "יפו 15",
    heightFloor: "קומה 2",
    additionalDetails: "נחיל גדול בחלון",
    status: "נפתחה פנייה (טופס מולא)",
    date: new Date().toLocaleDateString('he-IL'),
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    lat: 31.7857, // Jerusalem coordinates
    lng: 35.2007,
    coordinatorId: "3un80ldBwNORf4NpYGOPd76iyIl1",
    createdAt: serverTimestamp()
  },
  {
    fullName: "משה אברהם",
    phoneNumber: "054-5555555",
    city: "חיפה",
    address: "הרצל 8",
    heightFloor: "גג",
    additionalDetails: "נחיל על אנטנה",
    status: "נפתחה פנייה (טופס מולא)",
    date: new Date().toLocaleDateString('he-IL'),
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    lat: 32.7940, // Haifa coordinates
    lng: 34.9896,
    coordinatorId: null, // Unassigned inquiry
    createdAt: serverTimestamp()
  }
];

async function createTestInquiries() {
  console.log('🚀 Creating test inquiries in new database...');
  
  try {
    const inquiriesRef = collection(db, 'inquiry');
    
    for (let i = 0; i < testInquiries.length; i++) {
      const inquiry = testInquiries[i];
      console.log(`📍 Creating inquiry ${i + 1}: ${inquiry.address}, ${inquiry.city}`);
      
      const docRef = await addDoc(inquiriesRef, inquiry);
      console.log(`✅ Created inquiry with ID: ${docRef.id}`);
    }
    
    console.log(`\n🎉 Successfully created ${testInquiries.length} test inquiries!`);
    
  } catch (error) {
    console.error('❌ Error creating test inquiries:', error);
  }
}

createTestInquiries().then(() => {
  console.log('🏁 Test data creation completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
