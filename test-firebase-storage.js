// Test Firebase Storage functionality
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3VpXz9rYCiQqaK7nvcN6rD4W25uZtNtw",
  authDomain: "magendovrimadom.firebaseapp.com",
  projectId: "magendovrimadom",
  storageBucket: "magendovrimadom.firebasestorage.app",
  messagingSenderId: "3410485302",
  appId: "1:3410485302:web:0a1aa67ef9372079e33897",
  measurementId: "G-DRYS62FSP3"
};

async function testFirebaseStorage() {
  try {
    console.log('🔄 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📦 Storage bucket:', firebaseConfig.storageBucket);
    
    // Create a test file
    const testContent = new Blob(['Test photo content'], { type: 'text/plain' });
    const fileName = `test-photos/test-${Date.now()}.txt`;
    const storageRef = ref(storage, fileName);
    
    console.log('🔄 Uploading test file...');
    await uploadBytes(storageRef, testContent);
    console.log('✅ File uploaded successfully');
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Download URL obtained:', downloadURL);
    
    console.log('🎉 Firebase Storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
  }
}

testFirebaseStorage();
