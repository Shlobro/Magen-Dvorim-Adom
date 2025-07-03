import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// קבל את הנתיב הנוכחי של הקובץ (עבור ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טען את privateKey.json
const privateKeyPath = path.join(__dirname, '..', 'privateKey.json');
const serviceAccount = JSON.parse(readFileSync(privateKeyPath, 'utf8'));

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function deleteAllVolunteers() {
  try {
    console.log('🗑️  מתחיל תהליך מחיקת כל המתנדבים (userType = 2)...\n');
    
    // שלב 1: מציאת כל המתנדבים מ-Firestore
    console.log('📊 מחפש מתנדבים ב-Firestore...');
    const usersSnapshot = await db.collection('user').where('userType', '==', 2).get();
    
    if (usersSnapshot.empty) {
      console.log('✅ לא נמצאו מתנדבים למחיקה');
      return;
    }
    
    console.log(`📋 נמצאו ${usersSnapshot.size} מתנדבים למחיקה:\n`);
    
    // הצג רשימת המתנדבים שימחקו
    usersSnapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      console.log(`${index + 1}. ${userData.firstName || ''} ${userData.lastName || ''} (${userData.email || 'ללא אימייל'}) - ID: ${doc.id}`);
    });
    
    console.log('\n🔄 מתחיל תהליך המחיקה...\n');
    
    // שלב 2: מחיקה מ-Firestore באמצעות batch
    console.log('🗄️  מוחק מתנדבים מ-Firestore...');
    const batch = db.batch();
    
    usersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ הושלמה מחיקת המתנדבים מ-Firestore');
    
    // שלב 3: מחיקה מ-Firebase Authentication
    console.log('🔐 מוחק מתנדבים מ-Firebase Authentication...');
    let authDeleteCount = 0;
    let authDeleteErrors = 0;
    
    for (const doc of usersSnapshot.docs) {
      try {
        await admin.auth().deleteUser(doc.id);
        authDeleteCount++;
        console.log(`✅ נמחק מ-Auth: ${doc.data().email || doc.id}`);
      } catch (error) {
        authDeleteErrors++;
        console.error(`❌ שגיאה במחיקת משתמש מ-Auth (${doc.data().email || doc.id}):`, error.code || error.message);
      }
    }
    
    // סיכום התוצאות
    console.log('\n📊 סיכום תהליך המחיקה:');
    console.log('═══════════════════════════════════');
    console.log(`📋 סה"כ מתנדבים שנמצאו: ${usersSnapshot.size}`);
    console.log(`🗄️  נמחקו מ-Firestore: ${usersSnapshot.size}`);
    console.log(`🔐 נמחקו מ-Authentication: ${authDeleteCount}`);
    console.log(`❌ שגיאות ב-Authentication: ${authDeleteErrors}`);
    console.log('═══════════════════════════════════');
    
    if (authDeleteErrors === 0) {
      console.log('🎉 כל המתנדבים נמחקו בהצלחה!');
    } else {
      console.log('⚠️  התהליך הושלם עם כמה שגיאות');
    }
    
  } catch (error) {
    console.error('💥 שגיאה כללית בתהליך המחיקה:', error);
  }
}

// הרץ את הסקריפט
deleteAllVolunteers();
