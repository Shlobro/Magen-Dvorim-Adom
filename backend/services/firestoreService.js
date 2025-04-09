// backend/services/firestoreService.js
import db from './firebaseAdmin.js';

export async function saveUser(user) {
  await db.collection('user').doc(user.id).set(user, { merge: true });
}

export async function saveInquiry(inquiry) {
  await db.collection('inquiry').doc(inquiry.id).set(inquiry, { merge: true });
}

export async function linkUserToInquiry(link) {
  const docID = `${link.userID}_${link.inquiryID}`;
  await db.collection('userToInquiry').doc(docID).set(link, { merge: true });
}

export async function getUser(userID) {
  const docRef = db.collection('user').doc(userID);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return docSnap.data();
  } else {
    throw new Error("User not found");
  }
}

export async function queryUsers(filters) {
  let queryRef = db.collection('user');
  Object.keys(filters).forEach(key => {
    if (filters[key] !== "") {
      queryRef = queryRef.where(key, '==', filters[key]);
    }
  });
  const snapshot = await queryRef.get();
  const results = [];
  snapshot.forEach(doc => results.push(doc.data()));
  return results;
}

// Get all field names from a collection (based on 1 document sample)
export async function getAvailableFields(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const fieldSet = new Set();
  snapshot.forEach(doc => {
    Object.keys(doc.data()).forEach(field => fieldSet.add(field));
  });
  return Array.from(fieldSet);
}


// Get distinct values for a specific field in a collection
export async function getFilterOptions(collectionName, fieldName) {
  const snapshot = await db.collection(collectionName).get();
  const values = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (fieldName in data && data[fieldName] !== undefined) {
      values.add(data[fieldName]);
    }
  });
  return Array.from(values);
}

