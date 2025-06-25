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
    console.log("Inquiry received in inquiryRoutes:", inquiry);
    
    // בנה כתובת מלאה עבור הגיאו-קידוד
    const fullAddress = `${inquiry.address}, ${inquiry.city}, ישראל`;
    console.log("Full address for geocoding:", fullAddress);

    let locationData = null; // אתחל את אובייקט המיקום

    // בצע גיאו-קידוד רק אם קיימים נתוני עיר וכתובת
    if (inquiry.city && inquiry.address) {
      const coords = await geocodeAddress(fullAddress);
      console.log("Geocoding coordinates received:", coords);
      if (coords) {
        // שמור את הקואורדינטות כאובייקט location עם latitude ו-longitude
        locationData = {
          latitude: coords.lat,
          longitude: coords.lng
        };
      } else {
        console.warn(`Could not geocode address: ${fullAddress}. Location will be null.`);
        // locationData כבר null, אין צורך להגדיר מחדש
      }
    } else {
      console.warn("Missing city or address in inquiry. Skipping geocoding.");
      // locationData כבר null, אין צורך להגדיר מחדש
    }

    // הוסף את אובייקט ה-location לאובייקט הפנייה לפני השמירה
    inquiry.location = locationData; 
    
    // ודא שאין שדות lat ו-lng ישירים על אובייקט הפנייה כדי למנוע כפילויות
    delete inquiry.lat;
    delete inquiry.lng;

    console.log("Inquiry object before saving to Firestore:", inquiry);
    
    // קרא לפונקציה saveInquiry וקבל בחזרה את ה-ID של הפנייה שנשמרה/נוצרה
    const { id: newInquiryId } = await saveInquiry(inquiry); 
    
    // שלח תגובה עם ה-ID של הפנייה החדשה/מעודכנת
    res.status(200).send({ message: "Inquiry saved ✓", inquiryId: newInquiryId }); 
  } catch (error) {
    console.error("Error saving inquiry:", error);
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
      assignedVolunteers: FieldValue.arrayUnion(...volunteerIds), 
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
      assignedVolunteers: FieldValue.arrayRemove(...volunteerIds),
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

// GET /api/inquiries?coordinatorId=COORDINATOR_ID
// Returns inquiries for a coordinator: assigned to them or unassigned, including missing coordinatorId
router.get('/', async (req, res) => {
  const { coordinatorId } = req.query;
  try {
    let snap;
    if (coordinatorId) {
      // Get all inquiries and filter in code to include missing coordinatorId
      snap = await db.collection('inquiry').get();
      const filtered = snap.docs
        .filter(d => {
          const cId = d.get('coordinatorId');
          return (
            cId === undefined ||
            cId === null ||
            cId === '' ||
            cId === coordinatorId
          );
        })
        .map(d => ({ id: d.id, ...d.data() }));
      res.json(filtered);
    } else {
      snap = await db.collection('inquiry').get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Error querying inquiries');
  }
});

// POST /api/inquiries/:id/take-ownership
// Assigns the inquiry to the coordinator
router.post('/:id/take-ownership', async (req, res) => {
  const { coordinatorId } = req.body;
  if (!coordinatorId) return res.status(400).send('coordinatorId required');
  try {
    const docRef = db.collection('inquiry').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).send('Inquiry not found');
    const data = doc.data();
    if (data.coordinatorId && data.coordinatorId !== coordinatorId) {
      return res.status(409).send('Inquiry already assigned');
    }
    await docRef.update({ coordinatorId });
    res.send('Ownership taken');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error taking ownership');
  }
});

// GET /api/inquiries/volunteer/:volunteerId
// Returns inquiries assigned to a specific volunteer
router.get('/volunteer/:volunteerId', async (req, res) => {
  const { volunteerId } = req.params;
  try {
    // Query inquiries where assignedVolunteers contains the volunteer ID
    const snap = await db.collection('inquiry')
      .where('assignedVolunteers', '==', volunteerId)
      .get();
    
    const inquiries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(inquiries);
  } catch (e) {
    console.error('Error fetching volunteer inquiries:', e);
    res.status(500).send('Error fetching volunteer inquiries');
  }
});

export default router;