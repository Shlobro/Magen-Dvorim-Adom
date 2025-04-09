import express from 'express';
import { getAvailableFields, getFilterOptions } from '../services/firestoreService.js';

const router = express.Router();

// GET /api/filters/:collection/fields
router.get('/:collection/fields', async (req, res) => {
  try {
    const fields = await getAvailableFields(req.params.collection);
    res.status(200).json({ fields });
  } catch (err) {
    console.error("Error getting fields:", err);
    res.status(500).send("Failed to get field names");
  }
});

// GET /api/filters/:collection/filters/:field
router.get('/:collection/filters/:field', async (req, res) => {
  try {
    const values = await getFilterOptions(req.params.collection, req.params.field);
    res.status(200).json({ values });
  } catch (err) {
    console.error("Error getting filter values:", err);
    res.status(500).send("Failed to get filter values");
  }
});

export default router;
