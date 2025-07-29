import express from 'express';
import upload from '../middlewares/multerUpload.js';
import { saveInquiry } from '../services/firestoreService.js';
import { uploadPhotoAndSave } from '../controllers/inquiryController.js';
import db from '../services/firebaseAdmin.js'; // Firestore admin SDK
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue
import { geocodeAddress } from '../services/geocodeAddress.js';

const router = express.Router();

// Helper function to check if coordinator is approved
async function checkCoordinatorApproval(coordinatorId) {
  if (!coordinatorId) return { approved: false, error: 'Coordinator ID is required' };
  
  try {
    const coordinatorDoc = await db.collection('user').doc(coordinatorId).get();
    if (!coordinatorDoc.exists()) {
      return { approved: false, error: 'Coordinator not found' };
    }
    
    const coordinatorData = coordinatorDoc.data();
    if (coordinatorData.userType !== 1) {
      return { approved: false, error: 'User is not a coordinator' };
    }
    
    // Check approval status (true or undefined for legacy users)
    const isApproved = coordinatorData.approved === true || coordinatorData.approved === undefined;
    if (!isApproved) {
      return { approved: false, error: 'Coordinator is not approved' };
    }
    
    return { approved: true, coordinatorData };
  } catch (error) {
    console.error('Error checking coordinator approval:', error);
    return { approved: false, error: 'Database error' };
  }
}

// ========================================
// POST /inquiry/
// Create or update an inquiry document
// ========================================
router.post('/', async (req, res) => {
  try {
    const inquiry = req.body;
    console.log("Inquiry received in inquiryRoutes:", inquiry);
    
    // Validate required fields for geocoding
    if (!inquiry.city || !inquiry.address) {
      console.warn("Missing required address data for geocoding:", { 
        city: !!inquiry.city, 
        address: !!inquiry.address 
      });
      return res.status(400).json({
        error: "Missing required address data",
        message: "Both city and address are required for geocoding",
        details: {
          city: inquiry.city ? "present" : "missing",
          address: inquiry.address ? "present" : "missing"
        }
      });
    }
    
    // בנה כתובת מלאה עבור הגיאו-קידוד
    const fullAddress = `${inquiry.address}, ${inquiry.city}, ישראל`;
    console.log("Full address for geocoding:", fullAddress);

    let locationData = null; // אתחל את אובייקט המיקום

    // בצע גיאו-קידוד - STRICT VALIDATION: כתובת חייבת להיות ניתנת לקידוד
    const coords = await geocodeAddress(fullAddress);
    console.log("Geocoding coordinates received:", coords);
    if (coords) {
      // שמור את הקואורדינטות כאובייקט location עם latitude ו-longitude
      locationData = {
        latitude: coords.lat,
        longitude: coords.lng
      };
    } else {
      console.error(`❌ VALIDATION FAILED: Could not geocode address: ${fullAddress}`);
      return res.status(400).json({
        error: "Address validation failed",
        message: "לא ניתן לאתר את הכתובת במפה. אנא ודא שהכתובת מדויקת ותכלול גם את העיר.",
        address: fullAddress,
        details: "הפנייה לא נוצרה כיוון שלא ניתן לזהות את המיקום"
      });
    }

    // הוסף את אובייקט ה-location לאובייקט הפנייה לפני השמירה
    inquiry.location = locationData; 
    
    // ודא שאין שדות lat ו-lng ישירים על אובייקט הפנייה כדי למנוע כפילויות
    delete inquiry.lat;
    delete inquiry.lng;

    console.log("Inquiry object before saving to Firestore:", inquiry);
    
    // קרא לפונקציה saveInquiry וקבל בחזרה את ה-ID של הפנייה שנשמרה/נוצרה
    const { id: newInquiryId } = await saveInquiry(inquiry); 
    
    // שלח תגובה עם ה-ID של הפנייה החדשה/מעודכנת והקואורדינטות
    res.json({ 
      success: true, 
      id: newInquiryId,
      message: "Inquiry saved successfully",
      coordinates: locationData ? { lat: locationData.latitude, lng: locationData.longitude } : null
    }); 
  } catch (error) {
    console.error("Error saving inquiry:", error);
    res.status(500).send("Error saving inquiry");
  }
});

// ========================================
// POST /inquiry/:id/photo
// Upload photo for existing inquiry using Firebase Storage
// ========================================
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const inquiryId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    console.log(`📸 Processing photo upload for inquiry: ${inquiryId}`);
    console.log(`📁 File details:`, {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload photo to Firebase Storage and save URL to Firestore
    const photoUrl = await uploadPhotoAndSave(
      inquiryId, 
      req.file.buffer,
      req.file.originalname
    );

    console.log(`✅ Photo uploaded successfully: ${photoUrl}`);
    res.json({ 
      success: true, 
      photoUrl: photoUrl,
      message: 'Photo uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    res.status(500).json({ 
      error: 'Failed to upload photo', 
      details: error.message 
    });
  }
});


// =======================================================
// POST /inquiry/:id/assign
// Assign one or more volunteers to an inquiry
// =======================================================
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params; // ID של הפנייה
    const { volunteerIds, coordinatorId } = req.body; // מערך של ID מתנדבים ו-ID רכז

    console.log("Attempting to assign volunteer(s) to inquiry:", id); // LOG
    console.log("Received volunteerIds:", volunteerIds); // LOG
    console.log("Received coordinatorId:", coordinatorId); // LOG

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      console.warn("Validation failed: volunteerIds is not an array or is empty."); // LOG
      return res.status(400).send("Volunteer IDs array is required");
    }
    
    // Check if coordinator is approved (if coordinatorId is provided)
    if (coordinatorId) {
      const approvalCheck = await checkCoordinatorApproval(coordinatorId);
      if (!approvalCheck.approved) {
        return res.status(403).send(approvalCheck.error);
      }
    }

    // Get the current inquiry to check ownership
    const inquiryDoc = await db.collection("inquiry").doc(id).get();
    if (!inquiryDoc.exists) {
      return res.status(404).send("Inquiry not found");
    }

    const inquiryData = inquiryDoc.data();
    
    // Check if the coordinator has ownership (if coordinatorId is provided for validation)
    if (coordinatorId && inquiryData.coordinatorId !== coordinatorId) {
      return res.status(403).send("Cannot assign volunteers without ownership of this inquiry");
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
    const { volunteerIds, coordinatorId } = req.body;

    if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return res.status(400).send("Volunteer IDs array is required");
    }

    // Get the current inquiry to check ownership
    const inquiryDoc = await db.collection("inquiry").doc(id).get();
    if (!inquiryDoc.exists) {
      return res.status(404).send("Inquiry not found");
    }

    const inquiryData = inquiryDoc.data();
    
    // Check if the coordinator has ownership (if coordinatorId is provided for validation)
    if (coordinatorId && inquiryData.coordinatorId !== coordinatorId) {
      return res.status(403).send("Cannot unassign volunteers without ownership of this inquiry");
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
    const { status, closureReason, coordinatorId } = req.body;

    if (!status) {
      return res.status(400).send("Status is required");
    }

    // Get the current inquiry to check ownership
    const inquiryDoc = await db.collection("inquiry").doc(id).get();
    if (!inquiryDoc.exists) {
      return res.status(404).send("Inquiry not found");
    }

    const inquiryData = inquiryDoc.data();
    
    // Check if the coordinator has ownership (if coordinatorId is provided for validation)
    if (coordinatorId && inquiryData.coordinatorId !== coordinatorId) {
      return res.status(403).send("Cannot update status without ownership of this inquiry");
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

// ===================================================
// POST /inquiry/bulk-delete
// Bulk soft-delete multiple inquiries (mark as deleted)
// ===================================================
router.post('/bulk-delete', async (req, res) => {
  try {
    const { inquiryIds, coordinatorId } = req.body;

    if (!Array.isArray(inquiryIds) || inquiryIds.length === 0) {
      return res.status(400).json({ error: 'inquiryIds array is required' });
    }

    if (!coordinatorId) {
      return res.status(400).json({ error: 'coordinatorId is required' });
    }

    const batch = db.batch();
    const deletedAt = new Date().toISOString();
    let deletedCount = 0;

    for (const inquiryId of inquiryIds) {
      const inquiryRef = db.collection("inquiry").doc(inquiryId);
      
      // Only delete inquiries that are owned by this coordinator or unassigned
      const inquiryDoc = await inquiryRef.get();
      if (inquiryDoc.exists) {
        const data = inquiryDoc.data();
        if (!data.coordinatorId || data.coordinatorId === coordinatorId) {
          batch.update(inquiryRef, {
            deleted: true,
            deletedAt: deletedAt,
            deletedBy: coordinatorId
          });
          deletedCount++;
        }
      }
    }

    await batch.commit();

    res.status(200).json({ 
      message: `${deletedCount} inquiries deleted successfully`,
      deletedCount 
    });
  } catch (error) {
    console.error("Error bulk deleting inquiries:", error);
    res.status(500).json({ error: "Failed to bulk delete inquiries" });
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
          const data = d.data();
          // First filter out deleted inquiries
          if (data.deleted === true) {
            return false;
          }
          
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
      const filtered = snap.docs
        .filter(d => {
          const data = d.data();
          // Filter out deleted inquiries
          return data.deleted !== true;
        })
        .map(d => ({ id: d.id, ...d.data() }));
      res.json(filtered);
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
  
  // Check if coordinator is approved
  const approvalCheck = await checkCoordinatorApproval(coordinatorId);
  if (!approvalCheck.approved) {
    return res.status(403).send(approvalCheck.error);
  }
  
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
    res.status(500).send('Error taking ownership');  }
});

// POST /api/inquiries/:id/release-ownership
// Removes the coordinator assignment from the inquiry, returning it to the unassigned pool
router.post('/:id/release-ownership', async (req, res) => {
  const { coordinatorId } = req.body;
  if (!coordinatorId) return res.status(400).send('coordinatorId required');
  
  // Check if coordinator is approved
  const approvalCheck = await checkCoordinatorApproval(coordinatorId);
  if (!approvalCheck.approved) {
    return res.status(403).send(approvalCheck.error);
  }
  
  try {
    const docRef = db.collection('inquiry').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).send('Inquiry not found');
    const data = doc.data();
    if (!data.coordinatorId) {
      return res.status(400).send('Inquiry is not assigned to any coordinator');
    }
    if (data.coordinatorId !== coordinatorId) {
      return res.status(403).send('Can only release ownership of inquiries assigned to you');
    }
    await docRef.update({ coordinatorId: null });
    res.send('Ownership released');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error releasing ownership');
  }
});

// GET /api/inquiries/volunteer/:volunteerId
// Returns inquiries assigned to a specific volunteer
router.get('/volunteer/:volunteerId', async (req, res) => {
  const { volunteerId } = req.params;
  try {
    let inquiries = [];
    
    // Query inquiries where assignedVolunteers is an array containing the volunteer ID
    try {
      const arraySnap = await db.collection('inquiry')
        .where('assignedVolunteers', 'array-contains', volunteerId)
        .get();
      
      arraySnap.docs.forEach(d => {
        const data = d.data();
        // Only include non-deleted inquiries
        if (data.deleted !== true) {
          inquiries.push({ id: d.id, ...data });
        }
      });
    } catch (error) {
      console.warn('Array query failed:', error.message);
    }
    
    // Query inquiries where assignedVolunteers is a string equal to the volunteer ID (legacy format)
    try {
      const stringSnap = await db.collection('inquiry')
        .where('assignedVolunteers', '==', volunteerId)
        .get();
      
      stringSnap.docs.forEach(d => {
        const data = d.data();
        const existingIds = inquiries.map(inq => inq.id);
        // Only include non-deleted inquiries and avoid duplicates
        if (data.deleted !== true && !existingIds.includes(d.id)) {
          inquiries.push({ id: d.id, ...data });
        }
      });
    } catch (error) {
      console.warn('String query failed:', error.message);
    }
    
    res.json(inquiries);
  } catch (e) {
    console.error('Error fetching volunteer inquiries:', e);
    res.status(500).send('Error fetching volunteer inquiries');
  }
});

// POST /api/inquiries/:id/reassign
// Reassign inquiry to a different volunteer
router.post('/:id/reassign', async (req, res) => {
  const { volunteerId } = req.body;
  if (!volunteerId) return res.status(400).send('volunteerId required');
  
  try {
    const docRef = db.collection('inquiry').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).send('Inquiry not found');
    
    // Update the assigned volunteer
    await docRef.update({ 
      assignedVolunteers: [volunteerId],
      status: 'לפנייה שובץ מתנדב',
      reassignedAt: new Date().toISOString()
    });
    
    res.send('Volunteer reassigned successfully');
  } catch (e) {
    console.error('Error reassigning volunteer:', e);
    res.status(500).send('Error reassigning volunteer');
  }
});

export default router;