// backend/routes/userRoutes.js
import express from 'express';
import db from '../services/firebaseAdmin.js';           // Firestore Admin SDK
import admin from 'firebase-admin';                      // Firebase Admin (for auth)
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
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json(doc.data());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// GET /api/users/profile/:id - Get user profile data (enhanced with better error handling)
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const doc = await db.collection('user').doc(userId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    
    const userData = doc.data();
    
    // Return user data without sensitive information
    const profileData = {
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phoneNumber: userData.phoneNumber || '',
      email: userData.email || '',
      city: userData.city || '',
      streetName: userData.streetName || '',
      houseNumber: userData.houseNumber || '',
      idNumber: userData.idNumber || '',
      beeExperience: userData.beeExperience || false,
      beekeepingExperience: userData.beekeepingExperience || false,
      hasTraining: userData.hasTraining || false,
      heightPermit: userData.heightPermit || false,
      additionalDetails: userData.additionalDetails || '',
      organizationName: userData.organizationName || '',
      position: userData.position || '',
      userType: userData.userType || 2,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
    
    res.json(profileData);
  } catch (e) {
    console.error('Error fetching user profile:', e);
    res.status(500).json({ error: 'שגיאה בטעינת הפרופיל' });
  }
});

// PUT /api/users/profile/:id - Update user profile
router.put('/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = { ...req.body };
    
    // Add coordinates if location fields are provided
    if (updateData.city && updateData.streetName && updateData.houseNumber) {
      const fullAddress = `${updateData.streetName} ${updateData.houseNumber}, ${updateData.city}`;
      try {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          updateData.lat = coords.lat;
          updateData.lng = coords.lng;
          updateData.location = fullAddress;
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, continuing without coordinates:', geocodeError.message);
      }
    }
    
    // Add update timestamp
    updateData.updatedAt = new Date();
    
    // Update the user document
    await db.collection('user').doc(userId).update(updateData);
    
    res.json({ message: 'הפרופיל עודכן בהצלחה' });
  } catch (e) {
    console.error('Error updating user profile:', e);
    res.status(500).json({ error: 'שגיאה בעדכון הפרופיל' });
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
    res.json({ message: 'User saved successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error saving user' });
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
    res.json({ message: 'User updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// DELETE /api/users/:id - Remove a volunteer (delete from Firestore and Firebase Auth)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // First, delete the user document from Firestore
    await db.collection('user').doc(userId).delete();
    
    // Then, try to delete the user from Firebase Auth
    // Note: This might fail if the user doesn't exist in Auth or was already deleted
    try {
      await admin.auth().deleteUser(userId);
      console.log(`Successfully deleted Firebase Auth user: ${userId}`);
    } catch (authError) {
      // Log the error but don't fail the entire operation
      // The user might have already been deleted from Auth or might not exist
      console.warn(`Warning: Could not delete Firebase Auth user ${userId}:`, authError.message);
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (e) {
    console.error('Error deleting user:', e);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

export default router;
