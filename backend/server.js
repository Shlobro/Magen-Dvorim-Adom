// backend/server.js
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import filterRoutes from './routes/filterRoutes.js'

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/ping', (req, res) => {
  res.send("Server is running ✓");
});

// Mount routes
app.use('/user', userRoutes);
app.use('/inquiry', inquiryRoutes);
app.use('/link', linkRoutes);
app.use('/api/filters', filterRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
