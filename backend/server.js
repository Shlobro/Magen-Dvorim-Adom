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

// Security headers middleware
app.use((req, res, next) => {
  // Cache control headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'");
  
  // CORS headers (before cors middleware)
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
