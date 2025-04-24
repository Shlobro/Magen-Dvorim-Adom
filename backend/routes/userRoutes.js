// backend/routes/userRoutes.js
import express from 'express';
import { getUser, saveUser, queryUsers } from '../services/firestoreService.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});

router.post('/', async (req, res) => {
  try {
    await saveUser(req.body);
    res.status(200).send("User saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving user");
  }
});

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

// POST (or update) password for a given inquiry ID
router.post('/:id/password', async (req, res) => {
  try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
          return res.status(400).send("Password is required");
      }

      // Update the 'password' field in the 'inquiry' document
      await db.collection("inquiry").doc(id).update({ password });

      res.status(200).send("Password saved");
  } catch (error) {
      console.error("Error saving password:", error);
      res.status(500).send("Error saving password");
  }
});
// POST to update user data (e.g., qualifications, email, location, etc.)
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
