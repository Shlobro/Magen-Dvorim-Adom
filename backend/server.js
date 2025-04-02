// server.js
import express from 'express';
import cors from 'cors';
import { saveUser, saveInquiry, linkUserToInquiry, getUser } from './firestoreService.js';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/ping', (req, res) => {
  res.send('Server is running ✓');
});

// GET user by ID endpoint
app.get('/user/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});

// POST endpoint to save a user
app.post('/user', async (req, res) => {
  try {
    await saveUser(req.body);
    res.status(200).send('User saved ✓');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving user');
  }
});

// POST endpoint to save an inquiry
app.post('/inquiry', async (req, res) => {
  try {
    await saveInquiry(req.body);
    res.status(200).send('Inquiry saved ✓');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving inquiry');
  }
});

// POST endpoint to link a user to an inquiry
app.post('/link', async (req, res) => {
  try {
    await linkUserToInquiry(req.body);
    res.status(200).send('Link created ✓');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error linking user to inquiry');
  }
});

// Optional: Self-invoking function to insert test data
(async () => {
  try {
    await saveUser({
      id: "user123",
      name: "Alice",
      phone: "0501234567",
      location: "Jerusalem",
      userType: 2,
    });

    await saveInquiry({
      id: "inq456",
      date: "2025-04-02",
      height: 165,
      sex: "F",
      photo: "https://url-to-photo.jpg",
    });

    await linkUserToInquiry({
      userID: "user123",
      inquiryID: "inq456",
    });

    console.log("Test data written successfully.");
  } catch (error) {
    console.error("Error writing test data:", error);
  }
})();

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
