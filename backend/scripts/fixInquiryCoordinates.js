// backend/scripts/fixInquiryCoordinates.js
import db from '../services/firebaseAdmin.js';
import { geocodeAddress } from '../services/geocodeAddress.js';

async function fixInquiryCoordinates() {
  console.log('🔧 Starting to fix inquiry coordinates...');
  
  try {
    // Get all inquiries
    const snapshot = await db.collection('inquiry').get();
    console.log(`📊 Found ${snapshot.docs.length} inquiries to check`);
    
    let fixed = 0;
    let alreadyHasCoords = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const inquiryId = doc.id;
      
      console.log(`\n🔍 Checking inquiry ${inquiryId}:`);
      console.log(`  - City: ${data.city || 'N/A'}`);
      console.log(`  - Address: ${data.address || 'N/A'}`);
      console.log(`  - Current location:`, data.location);
      
      // Check if it already has coordinates
      if (data.location && 
          data.location.latitude != null && 
          data.location.longitude != null &&
          !isNaN(data.location.latitude) &&
          !isNaN(data.location.longitude)) {
        console.log(`  ✅ Already has valid coordinates: ${data.location.latitude}, ${data.location.longitude}`);
        alreadyHasCoords++;
        continue;
      }
      
      // Skip if missing essential address data
      if (!data.city || !data.address) {
        console.log(`  ⏭️ Skipping - missing city or address data`);
        skipped++;
        continue;
      }
      
      // Try to geocode
      const fullAddress = `${data.address}, ${data.city}, ישראל`;
      console.log(`  📍 Geocoding: ${fullAddress}`);
      
      try {
        const coords = await geocodeAddress(fullAddress);
        if (coords && coords.lat && coords.lng && !isNaN(coords.lat) && !isNaN(coords.lng)) {
          const locationData = {
            latitude: coords.lat,
            longitude: coords.lng
          };
          
          console.log(`  ✅ Found coordinates: ${coords.lat}, ${coords.lng}`);
          
          // Update the document
          await doc.ref.update({
            location: locationData,
            updatedAt: db.FieldValue.serverTimestamp()
          });
          
          console.log(`  💾 Updated inquiry ${inquiryId} with coordinates`);
          fixed++;
        } else {
          console.log(`  ❌ No valid coordinates found for: ${fullAddress}`);
          failed++;
        }
      } catch (error) {
        console.error(`  ❌ Error geocoding ${fullAddress}:`, error.message);
        failed++;
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Summary:');
    console.log(`  - Already had coordinates: ${alreadyHasCoords}`);
    console.log(`  - Successfully fixed: ${fixed}`);
    console.log(`  - Failed to geocode: ${failed}`);
    console.log(`  - Skipped (missing data): ${skipped}`);
    console.log(`  - Total processed: ${snapshot.docs.length}`);
    
    if (fixed > 0) {
      console.log('\n✅ Coordinate fixing completed successfully!');
      console.log('   The bee icons should now appear on the map.');
    } else if (alreadyHasCoords === snapshot.docs.length) {
      console.log('\n✅ All inquiries already have coordinates!');
    } else {
      console.log('\n⚠️ Some inquiries could not be fixed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing inquiry coordinates:', error);
  }
}

// Run the script
fixInquiryCoordinates()
  .then(() => {
    console.log('\n🏁 Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
