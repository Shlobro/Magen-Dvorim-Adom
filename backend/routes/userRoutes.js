// backend/routes/userRoutes.js

import express from 'express';
import { getUser, saveUser, queryUsers } from '../services/firestoreService.js';
import db from '../services/firebaseAdmin.js';
import { geocodeAddress } from '../services/geocodeAddress.js'; // ✅ Correct backend path

const router = express.Router();

// ==================================================================
// GET /user/:id — Retrieve a user by Firestore document ID
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

// ==================================================================
// POST /user — Save a new user, with geocoding if location is present
// ==================================================================
router.post('/', async (req, res) => {
  try {
    const user = req.body;

    // ✅ Add coordinates if location is defined
    if (user.location) {
      const coords = await geocodeAddress(user.location);
      if (coords) {
        user.lat = coords.lat;
        user.lng = coords.lng;
      }
    }

    // Save to Firestore
    await db.collection("user").doc(user.id).set(user);
    res.status(200).send("User saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving user");
  }
});

// ==================================================================
// GET /user — Query users with optional filters (e.g. userType)
// ==================================================================
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

// ==================================================================
// POST /user/:id/password — Update password field on inquiry doc
// ==================================================================
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
// Update user fields; re-geocode if location is updated
// ========================================================================
router.post('/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // ✅ If location is being updated, geocode it
    if (updateData.location) {
      const coords = await geocodeAddress(updateData.location);
      if (coords) {
        updateData.lat = coords.lat;
        updateData.lng = coords.lng;
      }
    }

    await db.collection("user").doc(id).update(updateData);

    res.status(200).send("User updated ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating user");
  }
});


export default router;
