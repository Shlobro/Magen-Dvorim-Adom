// backend/routes/userRoutes.js
import express from 'express';
import db from '../services/firebaseAdmin.js';           // Firestore Admin SDK
import { geocodeAddress } from '../services/geocodeAddress.js';

const router = express.Router();

// helper: haversine distance in km
const EARTH_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const haversine = (lat1, lng1, lat2, lng2) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Calculate comprehensive volunteer score based on multiple factors
const calculateVolunteerScore = async (volunteer, distance, volunteerId) => {
  let totalScore = 0;
  
  // 1. Distance Score (30% of total) - Maximum 30 points
  let distanceScore = 0;
  if (distance <= 15) {
    distanceScore = 30; // Full points for <= 15km
  } else if (distance <= 25) {
    distanceScore = 20; // 20 points for 15-25km
  } else if (distance <= 40) {
    distanceScore = 10; // 10 points for 25-40km
  } else {
    distanceScore = 0; // 0 points for > 40km
  }
  totalScore += distanceScore;
  
  // 2. Bee Removal Experience (15% of total) - Maximum 15 points
  if (volunteer.beeExperience === true) {
    totalScore += 15;
  }
  
  // 3. Beekeeping Experience (10% of total) - Maximum 10 points
  if (volunteer.beekeepingExperience === true) {
    totalScore += 10;
  }
  
  // 4. Training Experience (15% of total) - Maximum 15 points
  if (volunteer.hasTraining === true) {
    totalScore += 15;
  }
  
  // 5. Height Permit (10% of total) - Maximum 10 points
  if (volunteer.heightPermit === true) {
    totalScore += 10;
  }
  
  // 6. Assignment History Score (20% of total) - Maximum 20 points
  try {
    // Count completed assignments (הטיפול בנחיל הסתיים)
    const completedInquiriesSnapshot = await db.collection('inquiry')
      .where('assignedVolunteers', '==', volunteerId)
      .where('status', '==', 'הטיפול בנחיל הסתיים')
      .get();
    
    const completedCount = completedInquiriesSnapshot.size;
    
    if (completedCount === 0) {
      // Never completed a hive removal - gets full 20 points
      totalScore += 20;
    } else {
      // Has completed hive removals - gets reduced score (5 points)
      totalScore += 5;
    }
  } catch (error) {
    console.error('Error calculating assignment history score:', error);
    // Default to medium score if there's an error
    totalScore += 10;
  }
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
};

// ──────────────────────────────────────────────────────────────
// POST /api/users/queryNear   { lat, lng, radius }
// Returns volunteers within radius km, sorted by distance
// ──────────────────────────────────────────────────────────────
router.post('/queryNear', async (req, res) => {
  const { lat, lng, radius = 20 } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'lat & lng required' });

  try {
    const snap = await db.collection('user').where('userType', '==', 2).get();
    const volunteers = [];

    // Process each volunteer with scoring
    const volunteerPromises = [];
    
    snap.forEach((doc) => {
      const d = doc.data();
      if (typeof d.lat !== 'number' || typeof d.lng !== 'number') return;

      const dist = haversine(lat, lng, d.lat, d.lng);
      if (dist <= radius) {
        // Calculate comprehensive score for each volunteer
        const scorePromise = calculateVolunteerScore(d, dist, doc.id).then(score => ({
          id: doc.id,
          name: d.name || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim(),
          lat: d.lat,
          lng: d.lng,
          distance: dist,
          score: score,
          // Include experience data for frontend display
          beeExperience: d.beeExperience,
          beekeepingExperience: d.beekeepingExperience,
          hasTraining: d.hasTraining,
          heightPermit: d.heightPermit,
        }));
        
        volunteerPromises.push(scorePromise);
      }
    });

    // Wait for all score calculations to complete
    const scoredVolunteers = await Promise.all(volunteerPromises);
    
    // Sort by score (highest first), then by distance (closest first) as tiebreaker
    scoredVolunteers.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) { // If scores are very close
        return a.distance - b.distance; // Sort by distance
      }
      return b.score - a.score; // Sort by score (highest first)
    });
    
    res.json(scoredVolunteers);
  } catch (err) {
    console.error('queryNear error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ──────────────────────────────────────────────────────────────
// Existing CRUD routes (kept as-is, with geocoding on save / update)
// ─────────────────────────────────────────────────────────────-
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('user').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).send('User not found');
    res.json(doc.data());
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching user');
  }
});

router.post('/', async (req, res) => {
  try {
    const user = { ...req.body };

    if (user.location) {
      const coords = await geocodeAddress(user.location);
      if (coords) Object.assign(user, coords);
    }

    await db.collection('user').doc(user.id).set(user);
    res.send('User saved ✓');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error saving user');
  }
});

router.get('/', async (_req, res) => {
  try {
    const snap = await db.collection('user').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e) {
    console.error(e);
    res.status(500).send('Error querying users');
  }
});

router.post('/:id/password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).send('Password required');

  try {
    await db.collection('inquiry').doc(req.params.id).update({ password });
    res.send('Password saved');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error saving password');
  }
});

router.post('/:id/update', async (req, res) => {
  const updateData = { ...req.body };
  if (updateData.location) {
    const coords = await geocodeAddress(updateData.location);
    if (coords) Object.assign(updateData, coords);
  }

  try {
    await db.collection('user').doc(req.params.id).update(updateData);
    res.send('User updated ✓');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error updating user');
  }
});

// DELETE /api/users/:id - Remove a volunteer (delete from Firestore)
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('user').doc(req.params.id).delete();
    res.send('User deleted');
  } catch (e) {
    console.error(e);
    res.status(500).send('Error deleting user');
  }
});

export default router;
