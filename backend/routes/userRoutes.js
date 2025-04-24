// backend/routes/userRoutes.js

import express from 'express';
import { getUser, saveUser, queryUsers } from '../services/firestoreService.js';
import db from '../services/firebaseAdmin.js'; // Required for direct Firestore updates

const router = express.Router();


// ==================================================================
// GET /user/:id
// Retrieve a user document by its unique Firestore document ID
// ==================================================================
router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});


// =====================================================
// POST /user/
// Save a new user document to Firestore
// =====================================================
router.post('/', async (req, res) => {
  try {
    await saveUser(req.body);
    res.status(200).send("User saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving user");
  }
});


// ===================================================================
// GET /user/
// Query users using optional filter parameters (e.g., role, email)
// ===================================================================
router.get('/', async (req, res) => {
  try {
    const filters = req.query;
    const users = await queryUsers(filters);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error querying users");
  }
});


// ===================================================================
// POST /user/:id/password
// Update the password field of a related inquiry document
// ⚠️ Note: This currently updates the "inquiry" collection, not "user"
// ===================================================================
router.post('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).send("Password is required");
    }

    await db.collection("inquiry").doc(id).update({ password });

    res.status(200).send("Password saved");
  } catch (error) {
    console.error("Error saving password:", error);
    res.status(500).send("Error saving password");
  }
});


// ========================================================================
// POST /user/:id/update
// Update specific fields of a user document (e.g., name, email, location)
// Only fields provided in the request body are updated
// ========================================================================
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    await db.collection("user").doc(id).update(updateData);

    res.status(200).send("User updated ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating user");
  }
});

export default router;
