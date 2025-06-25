// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes    from './routes/userRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import linkRoutes    from './routes/linkRoutes.js';
import filterRoutes  from './routes/filterRoutes.js';
import geocodeRoutes from './routes/geocode.js';
import coordinatorRoutes from './routes/coordinatorRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────
// Health check
// ─────────────────────────────
app.get('/ping', (_req, res) => res.send('Server is running ✓'));

// ─────────────────────────────
// Mount feature routes
// ─────────────────────────────
app.use('/user',        userRoutes);      // legacy
app.use('/api/users',   userRoutes);      // NEW alias → /api/users/queryNear
app.use('/inquiry',     inquiryRoutes);
app.use('/api/inquiries', inquiryRoutes); // NEW alias for frontend
app.use('/link',        linkRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/coordinators', coordinatorRoutes); // NEW coordinator approval routes

// ─────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
