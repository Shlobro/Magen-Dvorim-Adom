import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../frontend/src/firebaseConfig.js';

async function checkInquiriesWithCoordinates() {
  console.log('🔍 Checking inquiries coordinates status...');
  
  try {
    const inquiriesRef = collection(db, 'inquiry');
    const querySnapshot = await getDocs(inquiriesRef);
    
    console.log(`📋 Found ${querySnapshot.docs.length} total inquiries\n`);
    
    let withCoords = 0;
    let withoutCoords = 0;
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const hasDirectCoords = data.lat != null && data.lng != null;
      const hasLocationCoords = data.location && data.location.latitude != null && data.location.longitude != null;
      const hasAnyCoords = hasDirectCoords || hasLocationCoords;
      
      if (hasAnyCoords) {
        withCoords++;
        let coords = '';
        if (hasDirectCoords) {
          coords = `lat=${data.lat}, lng=${data.lng}`;
        } else if (hasLocationCoords) {
          coords = `lat=${data.location.latitude}, lng=${data.location.longitude}`;
        }
        
        console.log(`✅ ${doc.id}: "${data.address || 'No address'}" - ${coords}`);
      } else {
        withoutCoords++;
        console.log(`❌ ${doc.id}: "${data.address || 'No address'}" - NO COORDINATES`);
        console.log(`   - data.lat: ${data.lat}`);
        console.log(`   - data.lng: ${data.lng}`);
        console.log(`   - data.location: ${JSON.stringify(data.location)}`);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - With coordinates: ${withCoords}`);
    console.log(`   - Without coordinates: ${withoutCoords}`);
    console.log(`   - Total: ${querySnapshot.docs.length}`);
    
  } catch (error) {
    console.error('❌ Error checking inquiries:', error);
  }
}

checkInquiriesWithCoordinates().catch(console.error);
