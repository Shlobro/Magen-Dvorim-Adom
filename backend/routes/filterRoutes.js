// backend/routes/filterRoutes.js

import express from 'express';
import { getAvailableFields, getFilterOptions } from '../services/firestoreService.js';

const router = express.Router();

// ==========================================================
// Collection alias mapping
// Maps URL route identifiers to Firestore collection names
// Example: "link" → "userToInquiry"
// ==========================================================
const COLLECTION_MAP = {
  user: 'user',
  inquiry: 'inqgiuiry', // Note: Typo? Should it be "inquiry"
  link: 'userToInquiry',
};


// ======================================================================
// GET /filters/:collection/fields
// Retrieve the list of available field names from a specified collection
// ======================================================================
router.get('/:collection/fields', async (req, res) => {
  // Resolve actual collection name using map or fallback
  const collectionName = COLLECTION_MAP[req.params.collection] || req.params.collection;

  try {
    const fields = await getAvailableFields(collectionName);
    res.status(200).json({ fields });
  } catch (err) {
    console.error("Error getting fields:", err);
    res.status(500).send("Failed to get field names");
  }
});


// ============================================================================
// GET /filters/:collection/filters/:field
// Retrieve all unique values for a specific field in a given collection
// Useful for dynamic filter dropdowns (e.g., status, city, role)
// ============================================================================
router.get('/:collection/filters/:field', async (req, res) => {
  // Resolve actual collection name using map or fallback
  const collectionName = COLLECTION_MAP[req.params.collection] || req.params.collection;

  try {
    const values = await getFilterOptions(collectionName, req.params.field);
    res.status(200).json({ values });
  } catch (err) {
    console.error("Error getting filter values:", err);
    res.status(500).send("Failed to get filter values");
  }
});

export default router;
