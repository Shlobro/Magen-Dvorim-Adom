// server.js
import express from "express";
import cors from "cors";
import { 
  saveUser, 
  saveInquiry, 
  linkUserToInquiry, 
  getUser, 
  queryUsers 
} from "./firestoreService.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/ping", (req, res) => {
  res.send("Server is running ✓");
});

// Retrieve a user by ID
app.get("/user/:id", async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(404).send("User not found");
  }
});

// Create or update a user
app.post("/user", async (req, res) => {
  try {
    await saveUser(req.body);
    res.status(200).send("User saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving user");
  }
});

// Create or update an inquiry
app.post("/inquiry", async (req, res) => {
  try {
    await saveInquiry(req.body);
    res.status(200).send("Inquiry saved ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving inquiry");
  }
});

// Create or update a link between user and inquiry
app.post("/link", async (req, res) => {
  try {
    await linkUserToInquiry(req.body);
    res.status(200).send("Link created ✓");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error linking user to inquiry");
  }
});

// Query users with filters passed as query parameters (e.g. /users?userType=2&location=Jerusalem)
app.get("/users", async (req, res) => {
  try {
    const filters = req.query;
    const users = await queryUsers(filters);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error querying users");
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
