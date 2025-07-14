// utils/fixMissingCoordinates.js
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { geocodeAddressWithFallback } from '../services/geocoding';

/**
 * Fix missing coordinates for existing inquiries
 * This utility can be run to update inquiries that were saved without coordinates
 */
export const fixMissingCoordinatesForInquiries = async () => {
  console.log('🔧 Starting to fix missing coordinates for inquiries...');
  
  try {
    // Get all inquiries
    const inquiriesRef = collection(db, 'inquiry');
    const snapshot = await getDocs(inquiriesRef);
    
    const inquiriesWithoutCoords = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Check if inquiry lacks coordinates
      if (!data.location || !data.location.latitude || !data.location.longitude) {
        if (data.city && data.address) {
          inquiriesWithoutCoords.push({
            id: doc.id,
            ...data
          });
        }
      }
    });
    
    console.log(`📊 Found ${inquiriesWithoutCoords.length} inquiries without coordinates`);
    
    if (inquiriesWithoutCoords.length === 0) {
      console.log('✅ All inquiries already have coordinates!');
      return { success: 0, failed: 0, total: 0 };
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const inquiry of inquiriesWithoutCoords) {
      try {
        console.log(`🔄 Processing inquiry ${inquiry.id}: ${inquiry.address}, ${inquiry.city}`);
        
        const fullAddress = `${inquiry.address}, ${inquiry.city}, ישראל`;
        const coords = await geocodeAddressWithFallback(fullAddress);
        
        if (coords && coords.lat && coords.lng) {
          // Update the inquiry with coordinates
          await updateDoc(doc(db, 'inquiry', inquiry.id), {
            location: {
              latitude: coords.lat,
              longitude: coords.lng
            },
            coordinatesFixed: true,
            coordinatesFixedAt: new Date()
          });
          
          console.log(`✅ Fixed coordinates for inquiry ${inquiry.id}: [${coords.lat}, ${coords.lng}]`);
          successCount++;
        } else {
          console.warn(`⚠️ Could not geocode inquiry ${inquiry.id}: ${fullAddress}`);
          failCount++;
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing inquiry ${inquiry.id}:`, error);
        failCount++;
      }
    }
    
    console.log('📊 Coordinates fixing completed:');
    console.log(`  ✅ Successfully fixed: ${successCount}`);
    console.log(`  ❌ Failed to fix: ${failCount}`);
    console.log(`  📝 Total processed: ${inquiriesWithoutCoords.length}`);
    
    return {
      success: successCount,
      failed: failCount,
      total: inquiriesWithoutCoords.length
    };
    
  } catch (error) {
    console.error('❌ Error in fixMissingCoordinatesForInquiries:', error);
    throw error;
  }
};

/**
 * Get inquiries without coordinates for inspection
 */
export const getInquiriesWithoutCoordinates = async () => {
  try {
    const inquiriesRef = collection(db, 'inquiry');
    const snapshot = await getDocs(inquiriesRef);
    
    const inquiriesWithoutCoords = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.location || !data.location.latitude || !data.location.longitude) {
        inquiriesWithoutCoords.push({
          id: doc.id,
          address: data.address,
          city: data.city,
          status: data.status,
          createdAt: data.createdAt
        });
      }
    });
    
    console.log(`📊 Found ${inquiriesWithoutCoords.length} inquiries without coordinates:`);
    inquiriesWithoutCoords.forEach(inquiry => {
      console.log(`  - ${inquiry.id}: ${inquiry.address}, ${inquiry.city} (${inquiry.status})`);
    });
    
    return inquiriesWithoutCoords;
    
  } catch (error) {
    console.error('❌ Error getting inquiries without coordinates:', error);
    throw error;
  }
};
