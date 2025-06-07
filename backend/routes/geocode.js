// backend/routes/geocode.js
import express from 'express';
import { geocodeAddress } from '../services/geocodeAddress.js';

const router = express.Router();

/**
 * POST /api/geocode
 * Body: { "address": "...", "city": "..." }
 * Success: 200 { lat, lng }
 * Not found: 200 { found:false }
 * Bad request: 400 { error:"Address required" }
 */
router.post('/', async (req, res) => {
  const { address = '', city = '' } = req.body;
  const query = city ? `${address}, ${city}` : address;

  if (!query.trim())
    return res.status(400).json({ error: 'Address required' });

  const loc = await geocodeAddress(query);
  if (loc) return res.json(loc);

  // not found → let frontend decide
  return res.json({ found: false });
});

export default router;
