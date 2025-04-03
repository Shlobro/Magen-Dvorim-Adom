// firebaseAdmin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// Load your Firebase service account key (ensure the filename is correct)
const serviceAccount = JSON.parse(
  readFileSync("privateKey.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
export default db;

