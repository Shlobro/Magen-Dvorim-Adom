// backend/routes/geocode.js
import express from 'express';
import { geocodeAddress } from '../services/geocodeAddress.js';

const router = express.Router();

/**
 * POST /api/geocode
 * Body: { "address": "...",  "city": "..." (optional) }
 * Returns: { lat, lng } or 400 / 404
 */
router.post('/', async (req, res) => {
  const { address = '', city = '' } = req.body;
  const query = city ? `${address}, ${city}` : address;

  if (!query.trim())
    return res.status(400).json({ error: 'Address required' });

  const loc = await geocodeAddress(query);
  if (loc) return res.json(loc);

  return res.status(404).json({ error: 'Could not geocode address' });
});

export default router;
