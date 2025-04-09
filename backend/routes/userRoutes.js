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

export default router;
