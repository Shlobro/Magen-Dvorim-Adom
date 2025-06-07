// backend/routes/inquiryRoutes.js

import express from 'express';
import upload from '../middlewares/multerUpload.js';
import { saveInquiry } from '../services/firestoreService.js';
import { uploadPhotoAndSave } from '../controllers/inquiryController.js';
import db from '../services/firebaseAdmin.js'; // Firestore admin SDK
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue
import { geocodeAddress } from '../services/geocodeAddress.js';

const router = express.Router();


// ========================================
// POST /inquiry/
// Create or update an inquiry document
// ========================================
router.post('/', async (req, res) => {
  try {
    const inquiry = req.body;
    console.log("Inquiry received in inquiryRoutes:", inquiry); // LOG: הצג את גוף הבקשה
    
    // בנה כתובת מלאה
    const fullAddress = `${inquiry.address}, ${inquiry.city}, ישראל`;
    console.log("Full address for geocoding:", fullAddress); // LOG: הצג את הכתובת שנבנתה

    if (inquiry.city && inquiry.address) { // ודא שקיימים נתוני עיר וכתובת
      const coords = await geocodeAddress(fullAddress);
      console.log("Geocoding coordinates received:", coords); // LOG: הצג את התוצאה מהגיאו-קידוד
      if (coords) {
        inquiry.lat = coords.lat;
        inquiry.lng = coords.lng;
      } else {
        console.warn(`Could not geocode address: ${fullAddress}. Lat/Lng will be null.`);
        inquiry.lat = null;
        inquiry.lng = null;
      }
    } else {
        console.warn("Missing city or address in inquiry. Skipping geocoding.");
        inquiry.lat = null;
        inquiry.lng = null;
    }

    console.log("Inquiry object before saving to Firestore:", inquiry); // LOG: הצג את האובייקט לפני השמירה
    await saveInquiry(inquiry);
    res.status(200).send("Inquiry saved ✓");
  } catch (error) {
    console.error("Error saving inquiry:", error); // LOG: הוספת הודעה מפורטת יותר
    res.status(500).send("Error saving inquiry");
  }
});


// =======================================================
// POST /inquiry/upload-photo
// Upload a photo and update the inquiry with its URL
// =======================================================
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    const { inquiryId } = req.body;
    const fileBuffer = req.file.buffer;
    const photoUrl = await uploadPhotoAndSave(inquiryId, fileBuffer);
    res.status(200).json({ photoUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).send('Failed to upload photo');
  }
});


// =======================================================
// POST /inquiry/:id/assign
// Assign one or more volunteers to an inquiry
// =======================================================
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params; // ID של הפנייה
    const { volunteerIds } = req.body; // מערך של ID מתנדבים

    console.log("Attempting to assign volunteer(s) to inquiry:", id); // LOG
    console.log("Received volunteerIds:", volunteerIds); // LOG

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      console.warn("Validation failed: volunteerIds is not an array or is empty."); // LOG
      return res.status(400).send("Volunteer IDs array is required");
    }

    await db.collection("inquiry").doc(id).update({
      assignedVolunteers: FieldValue.arrayUnion(...volunteerIds), // Changed from db.FieldValue
      status: "לפנייה שובץ מתנדב",
      assignedAt: new Date().toISOString()
    });

    console.log(`Volunteer(s) ${volunteerIds} assigned to inquiry ${id} successfully.`); // LOG
    res.status(200).send("Volunteers assigned ✓");
  } catch (error) {
    console.error("Error assigning volunteer:", error); // LOG
    res.status(500).send("Failed to assign volunteer");
  }
});


// ===================================================
// POST /inquiry/:id/unassign
// Unassign one or more volunteers from an inquiry
// ===================================================
router.post('/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerIds } = req.body;

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).send("Volunteer IDs array is required");
    }

    await db.collection("inquiry").doc(id).update({
      assignedVolunteers: FieldValue.arrayRemove(...volunteerIds), // Changed from db.FieldValue
      unassignedAt: new Date().toISOString()
    });

    res.status(200).send("Volunteers unassigned ✓");
  } catch (error) {
    console.error("Error unassigning volunteer:", error);
    res.status(500).send("Failed to unassign volunteer");
  }
});


// ===================================================
// POST /inquiry/:id/status
// Update status field on inquiry document
// ===================================================
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, closureReason } = req.body;

    if (!status) {
      return res.status(400).send("Status is required");
    }

    const updateData = { status };
    if (status === "הפנייה נסגרה" && closureReason) {
      updateData.closureReason = closureReason;
    } else if (status !== "הפנייה נסגרה") {
      updateData.closureReason = null; // Clear closure reason if status is not 'closed'
    }

    await db.collection("inquiry").doc(id).update(updateData);
    res.status(200).send("Status updated");
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).send("Error updating status");
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
    res.status(200).send("Inquiry visibility updated ✓");
  } catch (error) {
    console.error("Error updating visibility:", error);
    res.status(500).send("Failed to update visibility");
  }
});

export default router;