import express from 'express';
import db from '../services/firebaseAdmin.js';
import admin from 'firebase-admin';

const router = express.Router();

// POST /api/coordinators/approve - Approve a pending coordinator
router.post('/approve', async (req, res) => {
  try {
    const { pendingId, coordinatorData } = req.body;

    if (!pendingId || !coordinatorData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Create Firebase Auth user first
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: coordinatorData.email,
        password: coordinatorData.password,
        displayName: `${coordinatorData.firstName} ${coordinatorData.lastName}`,
        emailVerified: true, // Set as verified since it's approved by coordinator
      });
      console.log('Firebase Auth user created:', firebaseUser.uid);
    } catch (authError) {
      console.error('Error creating Firebase Auth user:', authError);
      return res.status(500).json({ 
        error: 'Failed to create authentication account',
        details: authError.message 
      });
    }    // Create the user in Firestore with coordinator role
    const userData = {
      id: firebaseUser.uid, // Use Firebase Auth UID as ID (not email)
      uid: firebaseUser.uid, // Store Firebase Auth UID
      firstName: coordinatorData.firstName,
      lastName: coordinatorData.lastName,
      email: coordinatorData.email,
      phoneNumber: coordinatorData.phoneNumber,
      city: coordinatorData.city,
      userType: 1, // Coordinator role
      isApproved: true,
      approvedAt: new Date(),
      createdAt: coordinatorData.createdAt || new Date(),
      // Add any other fields from the coordinator data (excluding password for security)
      ...Object.fromEntries(Object.entries(coordinatorData).filter(([key]) => key !== 'password'))
    };

    // Ensure userType is set correctly
    userData.userType = 1;

    try {
      // Save to users collection using UID as document ID (not email)
      await db.collection('user').doc(firebaseUser.uid).set(userData);
      console.log('Firestore user document created with UID:', firebaseUser.uid);
    } catch (firestoreError) {
      console.error('Error creating Firestore document:', firestoreError);
      // If Firestore fails, clean up the Auth user
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
      } catch (cleanupError) {
        console.error('Error cleaning up Auth user:', cleanupError);
      }
      return res.status(500).json({ 
        error: 'Failed to create user profile',
        details: firestoreError.message 
      });
    }

    // Remove from pending coordinators
    try {
      await db.collection('pendingCoordinators').doc(pendingId).delete();
      console.log('Pending coordinator record removed');
    } catch (deleteError) {
      console.error('Error removing pending coordinator:', deleteError);
      // Don't fail the request if we can't delete the pending record
    }

    console.log(`Coordinator approved: ${coordinatorData.email} (Auth UID: ${firebaseUser.uid})`);
    res.json({ 
      success: true, 
      message: 'Coordinator approved successfully',
      coordinatorId: coordinatorData.email,
      authUid: firebaseUser.uid
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

// GET /api/coordinators - Get all existing coordinators
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('user')
      .where('userType', '==', 1)
      .get();
    
    const coordinators = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        city: data.city,
        createdAt: data.createdAt,
        approvedAt: data.approvedAt,
        isApproved: data.isApproved
      };
    });
    
    res.json(coordinators);
  } catch (error) {
    console.error('Error fetching coordinators:', error);
    res.status(500).json({ error: 'Failed to fetch coordinators' });
  }
});

export default router;
