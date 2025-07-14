// scripts/fixExistingInquiries.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple geocoding function using Nominatim
async function geocodeAddress(address, city) {
  try {
    const fullAddress = `${address}, ${city}, Israel`;
    console.log(`🗺️ Geocoding: ${fullAddress}`);
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;
    
    // Add delay to respect rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MagenDvorimAdom/1.0 (Emergency Bee Removal Service)',
        'Accept': 'application/json',
        'Accept-Language': 'he,en'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      const result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
      console.log(`✅ Geocoding successful: ${result.latitude}, ${result.longitude}`);
      return result;
    }
    
    console.warn(`⚠️ No coordinates found for: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for ${address}, ${city}:`, error);
    return null;
  }
}

async function fixInquiryCoordinates() {
  try {
    console.log('🔄 Starting to fix inquiry coordinates...');
    
    // Get all inquiries
    const inquiriesRef = collection(db, 'inquiry');
    const snapshot = await getDocs(inquiriesRef);
    
    console.log(`📋 Found ${snapshot.docs.length} inquiries`);
    
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const docSnap of snapshot.docs) {
      const inquiry = docSnap.data();
      const inquiryId = docSnap.id;
      
      processed++;
      console.log(`\n🔄 Processing inquiry ${processed}/${snapshot.docs.length}: ${inquiryId}`);
      console.log(`   Address: ${inquiry.address}, ${inquiry.city}`);
      
      // Check if coordinates already exist
      if (inquiry.location && inquiry.location.latitude && inquiry.location.longitude) {
        console.log('   ✅ Already has coordinates, skipping');
        skipped++;
        continue;
      }
      
      // Check if we have address and city
      if (!inquiry.address || !inquiry.city) {
        console.log('   ⚠️ Missing address or city, skipping');
        skipped++;
        continue;
      }
      
      // Try to geocode
      const coordinates = await geocodeAddress(inquiry.address, inquiry.city);
      
      if (coordinates) {
        // Update the inquiry with coordinates
        try {
          await updateDoc(doc(db, 'inquiry', inquiryId), {
            location: coordinates
          });
          console.log(`   ✅ Updated inquiry with coordinates`);
          updated++;
        } catch (updateError) {
          console.error(`   ❌ Failed to update inquiry:`, updateError);
        }
      } else {
        console.log('   ❌ Could not geocode address');
      }
    }
    
    console.log('\n🎉 Coordinate fixing completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total processed: ${processed}`);
    console.log(`   - Updated with coordinates: ${updated}`);
    console.log(`   - Skipped (already had coordinates or missing data): ${skipped}`);
    
  } catch (error) {
    console.error('❌ Error fixing coordinates:', error);
  }
}

// Run the script
fixInquiryCoordinates().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
