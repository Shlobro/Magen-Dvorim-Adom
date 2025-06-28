// backend/services/firebaseAdmin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs'; // ייבוא הפונקציה לקריאת קבצים
import path from 'path'; // ייבוא מודול path לטיפול בנתיבים
import { fileURLToPath } from 'url'; // ייבוא לטיפול בנתיבי ES Modules

// קבל את הנתיב הנוכחי של הקובץ (עבור ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// חשוב: החלף בנתיב המדויק לקובץ ה-JSON של מפתח חשבון השירות שלך
// וודא שקובץ זה אינו חשוף לציבור (לדוגמה, הוסף אותו ל-.gitignore)
// נתיב יחסי לקובץ ה-privateKey.json מתוך backend/services/firebaseAdmin.js
const serviceAccountPath = path.resolve(__dirname, '../privateKey.json');

// קריאת קובץ ה-JSON וניתוחו
let serviceAccount;
try {
  const serviceAccountContent = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountContent);
} catch (error) {
  console.error("שגיאה בטעינת קובץ privateKey.json:", error);
  // אפשרות לסיים את התהליך אם הקובץ קריטי ולא נמצא
  process.exit(1);
}

// אתחול Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// ייצוא מופע ה-Firestore Admin SDK
const db = admin.firestore();

export { admin };  // Export the admin object
export default db;  // Keep the existing default export