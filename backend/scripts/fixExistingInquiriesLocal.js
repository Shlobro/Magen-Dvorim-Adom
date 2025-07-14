// backend/scripts/fixExistingInquiriesLocal.js
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Enhanced geocoding function with better reliability
async function geocodeAddressEnhanced(address) {
  if (!address || address.trim() === '') {
    console.log('❌ Empty address provided');
    return null;
  }

  const cleanAddress = address.trim();
  console.log(`🔍 Geocoding: "${cleanAddress}"`);

  // Add Israel to the search to improve accuracy
  const searchAddress = cleanAddress.includes('ישראל') ? cleanAddress : `${cleanAddress}, ישראל`;
  
  try {
    const params = new URLSearchParams({
      q: searchAddress,
      format: 'json',
      limit: '1',
      countrycodes: 'il', // Limit to Israel
      addressdetails: '1',
      'accept-language': 'he,en'
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      headers: {
        'User-Agent': 'MagenDvorimAdom/1.0 (bee-rescue@example.com)', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.log(`❌ HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Validate coordinates are in Israel (approximate bounds)
      if (lat >= 29.0 && lat <= 34.0 && lng >= 34.0 && lng <= 36.0) {
        console.log(`✅ Found coordinates: ${lat}, ${lng}`);
        return { lat, lng };
      } else {
        console.log(`❌ Coordinates outside Israel: ${lat}, ${lng}`);
        return null;
      }
    }
    
    console.log('❌ No results found');
    return null;
  } catch (error) {
    console.log(`❌ Error geocoding: ${error.message}`);
    return null;
  }
}

async function fixInquiryCoordinates() {
  console.log('🚀 Starting coordinate fix for existing inquiries...');
  
  try {
    // Get all inquiries from Firestore
    const inquiriesRef = collection(db, 'inquiry');
    const querySnapshot = await getDocs(inquiriesRef);
    
    console.log(`📋 Found ${querySnapshot.docs.length} total inquiries`);
    
    const inquiriesNeedingFix = [];
    
    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const hasValidCoords = data.lat != null && data.lng != null && 
                           !isNaN(data.lat) && !isNaN(data.lng);
      
      if (!hasValidCoords && data.address) {
        inquiriesNeedingFix.push({
          id: docSnap.id,
          address: data.address,
          status: data.status || 'unknown'
        });
      }
    });
    
    console.log(`🎯 Found ${inquiriesNeedingFix.length} inquiries needing coordinate fixes`);
    
    if (inquiriesNeedingFix.length === 0) {
      console.log('✅ No inquiries need coordinate fixes!');
      return;
    }
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const inquiry of inquiriesNeedingFix) {
      console.log(`\n📍 Processing inquiry ${inquiry.id}:`);
      console.log(`   Address: ${inquiry.address}`);
      console.log(`   Status: ${inquiry.status}`);
      
      const coordinates = await geocodeAddressEnhanced(inquiry.address);
      
      if (coordinates) {
        try {
          const inquiryRef = doc(db, 'inquiry', inquiry.id);
          await updateDoc(inquiryRef, {
            lat: coordinates.lat,
            lng: coordinates.lng,
            coordinateUpdated: new Date().toISOString()
          });
          
          console.log(`✅ Updated inquiry ${inquiry.id} with coordinates ${coordinates.lat}, ${coordinates.lng}`);
          fixedCount++;
        } catch (updateError) {
          console.log(`❌ Failed to update inquiry ${inquiry.id}: ${updateError.message}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️ Could not geocode address for inquiry ${inquiry.id}`);
        skippedCount++;
      }
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`⚠️ Skipped: ${skippedCount}`);
    console.log(`📋 Total processed: ${inquiriesNeedingFix.length}`);
    
  } catch (error) {
    console.error('❌ Error fixing coordinates:', error);
  }
}

// Run the script
fixInquiryCoordinates().then(() => {
  console.log('🏁 Coordinate fix script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
