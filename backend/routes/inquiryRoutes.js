// backend/routes/inquiryRoutes.js

import express from 'express';
import upload from '../middlewares/multerUpload.js';
import { saveInquiry } from '../services/firestoreService.js';
import { uploadPhotoAndSave } from '../controllers/inquiryController.js';
import db from '../services/firebaseAdmin.js'; // Firestore admin SDK
import { geocodeAddress } from '../services/geocodeAddress.js'; // ✅ Correct backend path

const router = express.Router();


// ========================================
// POST /inquiry/
// Create or update an inquiry document
// ========================================
router.post('/', async (req, res) => {
  try {
    const query = req.body;
    if (query.location) {
      const coords = await geocodeAddress(query.location);
      if (coords) {
        query.lat = coords.lat;
        query.lng = coords.lng;
      }
    }
    await saveInquiry(req.body);
    res.status(200).send("Inquiry saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving inquiry");
  }
});


// =======================================================
// POST /inquiry/upload-photo
// Upload a photo and update the inquiry with its URL
// =======================================================
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


// ====================================================
// GET /inquiry/:id/photo
// Retrieve the photo URL of an inquiry by its ID
// ====================================================
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


// ===========================================================
// GET /inquiry/
// Retrieve all inquiries with optional filter parameters
// ===========================================================
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    let queryRef = db.collection('inquiry');

    // Apply Firestore filters dynamically
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


// =======================================================
// POST /inquiry/:id/assign-volunteer
// Assign a volunteer to a specific inquiry
// =======================================================
router.post('/:id/assign-volunteer', async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;
    await db.collection("inquiry").doc(id).update({ assignedVolunteer: volunteerId });
    res.status(200).send("Volunteer assigned ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error assigning volunteer");
  }
});


// ================================================================
// POST /inquiry/:id/update-status
// Update inquiry status, volunteer comments, feedback, or height
// ================================================================
router.post('/:id/update-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, volunteerComment, feedback, height } = req.body;
    const updates = {
      ...(status && { status }),
      ...(volunteerComment && { volunteerComment }),
      ...(feedback && { feedback }),
      ...(height && { height }),
      lastStatusChange: new Date().toISOString()
    };
    await db.collection("inquiry").doc(id).update(updates);
    res.status(200).send("Inquiry status updated ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating inquiry");
  }
});


// ===================================================
// POST /inquiry/:id/submit-feedback
// Submit feedback and optional rating for an inquiry
// ===================================================
router.post('/:id/submit-feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    if (!feedback && rating === undefined) {
      return res.status(400).send("Feedback or rating is required");
    }

    const updates = {
      ...(feedback && { feedback }),
      ...(rating !== undefined && { rating }),
      feedbackSubmittedAt: new Date().toISOString(),
    };

    await db.collection("inquiry").doc(id).update(updates);
    res.status(200).send("Feedback submitted ✓");
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).send("Failed to submit feedback");
  }
});


// ======================================================
// POST /inquiry/:id/unassign-volunteer
// Remove volunteer assignment from an inquiry
// ======================================================
router.post('/:id/unassign-volunteer', async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("inquiry").doc(id).update({
      assignedVolunteer: null,
      unassignedAt: new Date().toISOString()
    });

    res.status(200).send("Volunteer unassigned ✓");
  } catch (error) {
    console.error("Error unassigning volunteer:", error);
    res.status(500).send("Failed to unassign volunteer");
  }
});


// ===================================================
// POST /inquiry/:id/delete
// Soft-delete an inquiry (mark as deleted)
// ===================================================
router.post('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("inquiry").doc(id).update({
      deleted: true,
      deletedAt: new Date().toISOString()
    });

    res.status(200).send("Inquiry soft-deleted ✓");
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).send("Failed to delete inquiry");
  }
});


// =======================================================
// POST /inquiry/:id/visibility
// Toggle or set inquiry visibility for frontend display
// =======================================================
router.post('/:id/visibility', async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    if (typeof visible !== "boolean") {
      return res.status(400).send("`visible` must be true or false");
    }

    await db.collection("inquiry").doc(id).update({
      visible,
      visibilityChangedAt: new Date().toISOString()
    });

    res.status(200).send(`Visibility updated to ${visible} ✓`);
  } catch (error) {
    console.error("Error updating visibility:", error);
    res.status(500).send("Failed to update visibility");
  }
});

export default router;
