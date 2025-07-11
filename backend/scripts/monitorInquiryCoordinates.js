// backend/scripts/monitorInquiryCoordinates.js
import db from '../services/firebaseAdmin.js';
import { geocodeAddress } from '../services/geocodeAddress.js';

/**
 * Monitor and fix inquiries without coordinates
 * This script can be run periodically to ensure all inquiries have coordinates
 */
async function monitorInquiryCoordinates() {
  console.log('🔍 Monitoring inquiry coordinates...');
  console.log('📅 Run time:', new Date().toISOString());
  
  try {
    // Get all inquiries
    const snapshot = await db.collection('inquiry').get();
    console.log(`📊 Total inquiries in database: ${snapshot.docs.length}`);
    
    let withCoords = 0;
    let withoutCoords = 0;
    let fixed = 0;
    let failed = 0;
    const problematicInquiries = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const inquiryId = doc.id;
      
      // Check if it has valid coordinates
      const hasValidCoords = data.location && 
          data.location.latitude != null && 
          data.location.longitude != null &&
          !isNaN(data.location.latitude) &&
          !isNaN(data.location.longitude);
      
      if (hasValidCoords) {
        withCoords++;
        continue;
      }
      
      withoutCoords++;
      console.log(`\n⚠️ Found inquiry without coordinates: ${inquiryId}`);
      console.log(`   - City: ${data.city || 'N/A'}`);
      console.log(`   - Address: ${data.address || 'N/A'}`);
      console.log(`   - Status: ${data.status || 'N/A'}`);
      console.log(`   - Created: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
      
      // Try to fix if we have address data
      if (data.city && data.address) {
        const fullAddress = `${data.address}, ${data.city}, ישראל`;
        console.log(`   📍 Attempting to geocode: ${fullAddress}`);
        
        try {
          const coords = await geocodeAddress(fullAddress);
          if (coords && coords.lat && coords.lng && !isNaN(coords.lat) && !isNaN(coords.lng)) {
            const locationData = {
              latitude: coords.lat,
              longitude: coords.lng
            };
            
            await doc.ref.update({
              location: locationData,
              updatedAt: db.FieldValue.serverTimestamp(),
              coordinatesAddedBy: 'monitor-script'
            });
            
            console.log(`   ✅ Fixed coordinates: ${coords.lat}, ${coords.lng}`);
            fixed++;
          } else {
            console.log(`   ❌ Geocoding failed for: ${fullAddress}`);
            failed++;
            problematicInquiries.push({
              id: inquiryId,
              city: data.city,
              address: data.address,
              reason: 'geocoding-failed'
            });
          }
        } catch (error) {
          console.error(`   ❌ Error geocoding: ${error.message}`);
          failed++;
          problematicInquiries.push({
            id: inquiryId,
            city: data.city,
            address: data.address,
            reason: 'geocoding-error'
          });
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`   ⏭️ Skipping - missing address data`);
        problematicInquiries.push({
          id: inquiryId,
          city: data.city,
          address: data.address,
          reason: 'missing-address-data'
        });
      }
    }
    
    // Generate report
    console.log('\n📊 COORDINATE MONITORING REPORT');
    console.log('================================');
    console.log(`📅 Scan time: ${new Date().toISOString()}`);
    console.log(`📊 Total inquiries: ${snapshot.docs.length}`);
    console.log(`✅ With coordinates: ${withCoords} (${((withCoords/snapshot.docs.length)*100).toFixed(1)}%)`);
    console.log(`⚠️ Without coordinates: ${withoutCoords} (${((withoutCoords/snapshot.docs.length)*100).toFixed(1)}%)`);
    console.log(`🔧 Fixed this run: ${fixed}`);
    console.log(`❌ Failed to fix: ${failed}`);
    
    if (problematicInquiries.length > 0) {
      console.log('\n🚨 PROBLEMATIC INQUIRIES:');
      problematicInquiries.forEach((inquiry, index) => {
        console.log(`${index + 1}. ID: ${inquiry.id}`);
        console.log(`   City: ${inquiry.city || 'N/A'}`);
        console.log(`   Address: ${inquiry.address || 'N/A'}`);
        console.log(`   Reason: ${inquiry.reason}`);
      });
    }
    
    // Health status
    const healthPercentage = (withCoords / snapshot.docs.length) * 100;
    console.log('\n🏥 SYSTEM HEALTH:');
    if (healthPercentage >= 95) {
      console.log('🟢 EXCELLENT - 95%+ inquiries have coordinates');
    } else if (healthPercentage >= 85) {
      console.log('🟡 GOOD - 85%+ inquiries have coordinates');
    } else if (healthPercentage >= 70) {
      console.log('🟠 WARNING - Less than 85% inquiries have coordinates');
    } else {
      console.log('🔴 CRITICAL - Less than 70% inquiries have coordinates');
    }
    
    console.log(`📊 Coordinate coverage: ${healthPercentage.toFixed(1)}%`);
    
    return {
      total: snapshot.docs.length,
      withCoords,
      withoutCoords,
      fixed,
      failed,
      healthPercentage,
      problematicInquiries
    };
    
  } catch (error) {
    console.error('❌ Error monitoring inquiry coordinates:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorInquiryCoordinates()
    .then((result) => {
      console.log('\n✅ Monitoring completed successfully');
      process.exit(result.withoutCoords > 0 ? 1 : 0); // Exit code 1 if issues found
    })
    .catch((error) => {
      console.error('❌ Monitoring failed:', error);
      process.exit(2);
    });
}

export { monitorInquiryCoordinates };
