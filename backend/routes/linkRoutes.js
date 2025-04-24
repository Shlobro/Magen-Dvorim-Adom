// backend/routes/linkRoutes.js
import express from 'express';
import { linkUserToInquiry } from '../services/firestoreService.js';
import db from '../services/firebaseAdmin.js'; // ✅ required

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await linkUserToInquiry(req.body);
    res.status(200).send("Link created ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error linking user to inquiry");
  }
});

router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    console.log("Link filters received:", filters);
    let queryRef = db.collection('userToInquiry');

    // Apply filtering (e.g., userID or inquiryID)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '') {
        queryRef = queryRef.where(key, '==', filters[key]);
      }
    });

    const snapshot = await queryRef.get();
    const results = [];
    snapshot.forEach(doc => results.push(doc.data()));

    res.status(200).json(results);
  } catch (error) {
    console.error('Error querying userToInquiry:', error);
    res.status(500).send('Failed to retrieve links');
  }
});

export default router;
