// backend/routes/linkRoutes.js
import express from 'express';
import { linkUserToInquiry } from '../services/firestoreService.js';

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

export default router;
