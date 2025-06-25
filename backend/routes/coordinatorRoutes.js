import express from 'express';
import db from '../services/firebaseAdmin.js';

const router = express.Router();

// POST /api/coordinators/approve - Approve a pending coordinator
router.post('/approve', async (req, res) => {
  try {
    const { pendingId, coordinatorData } = req.body;

    if (!pendingId || !coordinatorData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Create the user in Firebase Auth and Firestore with coordinator role
    const userData = {
      id: coordinatorData.email, // Use email as ID
      firstName: coordinatorData.firstName,
      lastName: coordinatorData.lastName,
      email: coordinatorData.email,
      phoneNumber: coordinatorData.phoneNumber,
      city: coordinatorData.city,
      userType: 1, // Coordinator role
      isApproved: true,
      approvedAt: new Date(),
      createdAt: coordinatorData.createdAt || new Date(),
      // Include password if provided for the coordinator account
      ...(coordinatorData.password && { password: coordinatorData.password }),
      // Add any other fields from the coordinator data (excluding password to avoid duplication)
      ...Object.fromEntries(Object.entries(coordinatorData).filter(([key]) => key !== 'password')),
      userType: 1 // Ensure it's set to coordinator
    };

    // Save to users collection
    await db.collection('user').doc(coordinatorData.email).set(userData);

    // Remove from pending coordinators
    await db.collection('pendingCoordinators').doc(pendingId).delete();

    console.log(`Coordinator approved: ${coordinatorData.email}`);
    res.json({ 
      success: true, 
      message: 'Coordinator approved successfully',
      coordinatorId: coordinatorData.email 
    });

  } catch (error) {
    console.error('Error approving coordinator:', error);
    res.status(500).json({ 
      error: 'Failed to approve coordinator',
      details: error.message 
    });
  }
});

// GET /api/coordinators/pending - Get all pending coordinators
router.get('/pending', async (req, res) => {
  try {
    const snapshot = await db.collection('pendingCoordinators').get();
    const pendingCoordinators = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(pendingCoordinators);
  } catch (error) {
    console.error('Error fetching pending coordinators:', error);
    res.status(500).json({ error: 'Failed to fetch pending coordinators' });
  }
});

// DELETE /api/coordinators/pending/:id - Reject a pending coordinator
router.delete('/pending/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('pendingCoordinators').doc(id).delete();
    res.json({ success: true, message: 'Pending coordinator rejected' });
  } catch (error) {
    console.error('Error rejecting coordinator:', error);
    res.status(500).json({ error: 'Failed to reject coordinator' });
  }
});

// POST /api/coordinators/signup - Submit a new coordinator signup request
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, city, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !city || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists in users or pending coordinators
    try {
      const existingUser = await db.collection('user').doc(email).get();
      if (existingUser.exists) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const pendingSnapshot = await db.collection('pendingCoordinators')
        .where('email', '==', email.toLowerCase())
        .get();
      
      if (!pendingSnapshot.empty) {
        return res.status(400).json({ error: 'Signup request already pending for this email' });
      }
    } catch (checkError) {
      console.error('Error checking existing records:', checkError);
    }

    // Create pending coordinator record
    const pendingCoordinatorData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      city: city.trim(),
      password: password, // Store password temporarily for approval process
      createdAt: new Date(),
      agreedToEthics: true,
      status: 'pending'
    };

    const docRef = await db.collection('pendingCoordinators').add(pendingCoordinatorData);

    console.log(`New coordinator signup: ${email} (ID: ${docRef.id})`);
    res.json({ 
      success: true, 
      message: 'Coordinator signup request submitted successfully',
      requestId: docRef.id 
    });

  } catch (error) {
    console.error('Error submitting coordinator signup:', error);
    res.status(500).json({ 
      error: 'Failed to submit signup request',
      details: error.message 
    });
  }
});

export default router;
