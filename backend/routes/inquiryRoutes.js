// backend/routes/inquiryRoutes.js
import express from 'express';
import upload from '../middlewares/multerUpload.js';
import { saveInquiry } from '../services/firestoreService.js';
import { uploadPhotoAndSave } from '../controllers/inquiryController.js';
import db from '../services/firebaseAdmin.js'; // Import db for GET route

const router = express.Router();

// Create or update an inquiry
router.post('/', async (req, res) => {
  try {
    await saveInquiry(req.body);
    res.status(200).send("Inquiry saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving inquiry");
  }
});

// Upload photo and update inquiry document
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  const inquiryId = req.body.inquiryId;
  const file = req.file;

  if (!inquiryId || !file) {
    return res.status(400).send("Missing inquiryId or photo");
  }

  try {
    const photoUrl = await uploadPhotoAndSave(inquiryId, file.buffer);
    res.status(200).json({ photoUrl });
  } catch (err) {
    console.error("Upload or Firestore error:", err);
    res.status(500).send("Internal server error");
  }
});

// Retrieve photo URL for a specific inquiry
router.get('/:id/photo', async (req, res) => {
  const inquiryId = req.params.id;
  try {
    const doc = await db.collection("inquiry").doc(inquiryId).get();
    if (!doc.exists || !doc.data().photo) {
      return res.status(404).send("Photo not found");
    }
    res.status(200).json({ photoUrl: doc.data().photo });
  } catch (error) {
    console.error("Error retrieving photo:", error);
    res.status(500).send("Failed to retrieve photo");
  }
});

// GET /inquiry with optional filters (e.g., ?status=pending)
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    let queryRef = db.collection('inquiry');

    // Apply filters (same logic used in user query)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== "") {
        queryRef = queryRef.where(key, '==', filters[key]);
      }
    });

    const snapshot = await queryRef.get();
    const results = [];
    snapshot.forEach(doc => results.push(doc.data()));

    res.status(200).json(results);
  } catch (error) {
    console.error("Error querying inquiries:", error);
    res.status(500).send("Error retrieving inquiries");
  }
});

export default router;
