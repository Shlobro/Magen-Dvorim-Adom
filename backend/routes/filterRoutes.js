import express from 'express';
import { getAvailableFields, getFilterOptions } from '../services/firestoreService.js';

const router = express.Router();

// Maps logical route names to actual Firestore collection names
const COLLECTION_MAP = {
  user: 'user',
  inquiry: 'inquiry',
  link: 'userToInquiry', // ✅ maps "link" → Firestore collection
};

// GET /api/filters/:collection/fields
router.get('/:collection/fields', async (req, res) => {
  const collectionName = COLLECTION_MAP[req.params.collection] || req.params.collection;
  try {
    const fields = await getAvailableFields(collectionName);
    res.status(200).json({ fields });
  } catch (err) {
    console.error("Error getting fields:", err);
    res.status(500).send("Failed to get field names");
  }
});

// GET /api/filters/:collection/filters/:field
router.get('/:collection/filters/:field', async (req, res) => {
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
