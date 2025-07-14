import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';
import axios from 'axios';

// Function to geocode address using OpenStreetMap Nominatim
async function geocodeAddress(address, city) {
  try {
    const fullAddress = `${address}, ${city || ''}, Israel`.trim();
    console.log(`🔍 Geocoding: "${fullAddress}"`);
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 1,
        countrycodes: 'il',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'MagenDvorimAdom/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      console.log(`✅ Found coordinates: lat=${lat}, lng=${lng}`);
      return { lat, lng };
    } else {
      console.log(`❌ No coordinates found for: ${fullAddress}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function fixMissingCoordinates() {
  console.log('🔧 Starting coordinate fixing process...');
  
  try {
    const snapshot = await getDocs(collection(db, 'inquiry'));
    const inquiriesWithoutCoords = [];
    
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const hasCoords = (data.lat != null && data.lng != null) || 
                       (data.location && data.location.latitude != null && data.location.longitude != null);
      
      if (!hasCoords) {
        inquiriesWithoutCoords.push({
          id: docSnapshot.id,
          address: data.address,
          city: data.city,
          coordinatorId: data.coordinatorId,
          status: data.status
        });
      }
    });
    
    console.log(`📋 Found ${inquiriesWithoutCoords.length} inquiries without coordinates:`);
    inquiriesWithoutCoords.forEach(inq => {
      console.log(`  📍 ${inq.id}: "${inq.address}, ${inq.city}" (coordinator: ${inq.coordinatorId})`);
    });
    
    if (inquiriesWithoutCoords.length === 0) {
      console.log('✅ All inquiries already have coordinates!');
      return;
    }
    
    console.log('\n🚀 Starting geocoding process...');
    
    for (let i = 0; i < inquiriesWithoutCoords.length; i++) {
      const inquiry = inquiriesWithoutCoords[i];
      console.log(`\n[${i + 1}/${inquiriesWithoutCoords.length}] Processing: ${inquiry.address}, ${inquiry.city}`);
      
      const coordinates = await geocodeAddress(inquiry.address, inquiry.city);
      
      if (coordinates) {
        try {
          const docRef = doc(db, 'inquiry', inquiry.id);
          await updateDoc(docRef, {
            lat: coordinates.lat,
            lng: coordinates.lng,
            geocoded: true,
            geocodedAt: new Date().toISOString()
          });
          
          console.log(`✅ Updated inquiry ${inquiry.id} with coordinates`);
        } catch (updateError) {
          console.error(`❌ Failed to update inquiry ${inquiry.id}:`, updateError.message);
        }
      } else {
        console.log(`⚠️ Skipping inquiry ${inquiry.id} - no coordinates found`);
      }
      
      // Wait 1 second between requests to be nice to the geocoding service
      if (i < inquiriesWithoutCoords.length - 1) {
        console.log('⏳ Waiting 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Coordinate fixing process completed!');
    
  } catch (error) {
    console.error('❌ Error in fixing coordinates:', error);
  }
}

// Run the script
fixMissingCoordinates().catch(console.error);
