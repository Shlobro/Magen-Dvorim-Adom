// firestoreService.js
import db from "./firebaseAdmin.js";

// Save or update a user document
export async function saveUser(user) {
  await db.collection("user").doc(user.id).set(user, { merge: true });
}

// Save or update an inquiry document
export async function saveInquiry(inquiry) {
  await db.collection("inquiry").doc(inquiry.id).set(inquiry, { merge: true });
}

// Create or update a link between a user and an inquiry
export async function linkUserToInquiry(link) {
  const docID = `${link.userID}_${link.inquiryID}`;
  await db.collection("userToInquiry").doc(docID).set(link, { merge: true });
}

// Retrieve a user by their ID
export async function getUser(userID) {
  const docRef = db.collection("user").doc(userID);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return docSnap.data();
  } else {
    throw new Error("User not found");
  }
}

/**
 * Query users with filter criteria.
 * Example filters: { userType: 2, location: "Jerusalem" }
 * @param {Object} filters - An object containing field/value pairs for filtering.
 * @returns {Promise<Array>} - An array of user objects matching the filters.
 */
export async function queryUsers(filters) {
  let queryRef = db.collection("user");

  Object.keys(filters).forEach(key => {
    if (filters[key] !== "") { // Only add filters with a value
      queryRef = queryRef.where(key, "==", filters[key]);
    }
  });

  const snapshot = await queryRef.get();
  const results = [];
  snapshot.forEach(doc => {
    results.push(doc.data());
  });
  return results;
}
