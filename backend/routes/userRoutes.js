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

// DELETE /api/users/self/:id - Allow volunteer to delete their own account
router.delete('/self/:id', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    
    if (!volunteerId) {
      return res.status(400).json({ error: 'Volunteer ID is required' });
    }
    
    // First get volunteer data for logging purposes
    const volunteerDoc = await db.collection('user').doc(volunteerId).get();
    if (!volunteerDoc.exists) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    const volunteerData = volunteerDoc.data();
    
    // Verify this is actually a volunteer (role = 2)
    if (volunteerData.role !== 2) {
      return res.status(403).json({ error: 'Only volunteers can use this endpoint' });
    }
    
    // Check if volunteer has any active assigned inquiries
    const activeInquiriesSnapshot = await db.collection('inquiry')
      .where('assignedVolunteers', 'array-contains', volunteerId)
      .where('status', 'in', ['לפנייה שובץ מתנדב', 'המתנדב בדרך'])
      .get();
    
    if (!activeInquiriesSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Cannot delete account while assigned to active inquiries',
        message: 'יש לך פניות פעילות שממתינות לטיפול. אנא השלם את הטיפול או פנה לרכז לביטול ההקצאה לפני מחיקת החשבון.'
      });
    }
    
    // Remove volunteer from any completed inquiries (for data consistency)
    const completedInquiriesSnapshot = await db.collection('inquiry')
      .where('assignedVolunteers', 'array-contains', volunteerId)
      .get();
    
    const batch = db.batch();
    
    completedInquiriesSnapshot.forEach((doc) => {
      const inquiry = doc.data();
      const updatedVolunteers = inquiry.assignedVolunteers.filter(id => id !== volunteerId);
      batch.update(doc.ref, { 
        assignedVolunteers: updatedVolunteers,
        lastModified: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Delete the volunteer document from Firestore
    batch.delete(db.collection('user').doc(volunteerId));
    
    // Commit the batch operation
    await batch.commit();
    console.log(`Firestore volunteer document deleted: ${volunteerId}`);
    
    // Delete the volunteer from Firebase Auth
    try {
      await admin.auth().deleteUser(volunteerId);
      console.log(`Firebase Auth volunteer deleted: ${volunteerId}`);
    } catch (authError) {
      // Log the error but don't fail the entire operation
      console.warn(`Warning: Could not delete Firebase Auth volunteer ${volunteerId}:`, authError.message);
    }
    
    console.log(`Volunteer self-deleted: ${volunteerData.email} (${volunteerData.firstName} ${volunteerData.lastName}) (UID: ${volunteerId})`);
    res.json({ 
      success: true, 
      message: 'Volunteer account deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting volunteer account:', error);
    res.status(500).json({ 
      error: 'Failed to delete volunteer account',
      details: error.message 
    });
  }
});

// POST /api/users/bulk-create - Create multiple volunteers from Excel upload
router.post('/bulk-create', async (req, res) => {
  try {
    const { volunteers } = req.body;
    
    if (!volunteers || !Array.isArray(volunteers)) {
      return res.status(400).json({ error: 'Invalid volunteers data' });
    }

    const results = {
      success: true,
      created: 0,
      errors: [],
      duplicates: []
    };

    for (const volunteer of volunteers) {
      try {
        // Check if user already exists by email
        const existingUserSnapshot = await db.collection('user')
          .where('email', '==', volunteer.email)
          .get();

        if (!existingUserSnapshot.empty) {
          results.duplicates.push(`${volunteer.firstName} ${volunteer.lastName} (${volunteer.email}) - משתמש קיים`);
          continue;
        }

        // Create Firebase Auth user with default password
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().createUser({
            email: volunteer.email,
            password: volunteer.password || '123456', // Default password
            displayName: `${volunteer.firstName} ${volunteer.lastName}`,
          });
        } catch (authError) {
          if (authError.code === 'auth/email-already-exists') {
            // Try to get the existing user
            try {
              firebaseUser = await admin.auth().getUserByEmail(volunteer.email);
            } catch (getUserError) {
              results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: שגיאה ביצירת משתמש - ${authError.message}`);
              continue;
            }
          } else {
            results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: שגיאה ביצירת משתמש - ${authError.message}`);
            continue;
          }
        }

        // Geocode address if provided - STRICT validation
        let coordinates = {};
        if (volunteer.city && volunteer.address) {
          try {
            const fullAddress = `${volunteer.address}, ${volunteer.city}`;
            const coords = await geocodeAddress(fullAddress);
            if (coords) {
              coordinates = {
                lat: coords.lat,
                lng: coords.lng,
                location: fullAddress
              };
            } else {
              // Geocoding failed - reject this volunteer
              results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: לא ניתן לזהות את הכתובת "${fullAddress}" - המתנדב לא נוסף למערכת`);
              continue;
            }
          } catch (geocodeError) {
            // Geocoding error - reject this volunteer
            results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: שגיאה בזיהוי כתובת "${volunteer.address}, ${volunteer.city}" - ${geocodeError.message}`);
            continue;
          }
        } else if (volunteer.city && !volunteer.address) {
          // Only city provided - try to geocode just the city
          try {
            const coords = await geocodeAddress(volunteer.city);
            if (coords) {
              coordinates = {
                lat: coords.lat,
                lng: coords.lng,
                location: volunteer.city
              };
            } else {
              // City geocoding failed - reject this volunteer
              results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: לא ניתן לזהות את העיר "${volunteer.city}" - המתנדב לא נוסף למערכת`);
              continue;
            }
          } catch (geocodeError) {
            // City geocoding error - reject this volunteer
            results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: שגיאה בזיהוי עיר "${volunteer.city}" - ${geocodeError.message}`);
            continue;
          }
        }
        // If no city and no address provided, allow the volunteer (coordinates will remain empty)

        // Create user document in Firestore
        const userData = {
          firstName: volunteer.firstName,
          lastName: volunteer.lastName,
          email: volunteer.email,
          phoneNumber: volunteer.phoneNumber || '',
          idNumber: volunteer.idNumber || '',
          city: volunteer.city || '',
          streetName: volunteer.address || '',
          houseNumber: '', // We'll put the full address in streetName for now
          beeExperience: volunteer.beeExperience || false,
          beekeepingExperience: volunteer.beekeepingExperience || false,
          hasTraining: volunteer.hasTraining || false,
          heightPermit: volunteer.heightPermit || false,
          previousEvacuation: volunteer.previousEvacuation || false, // New field
          additionalDetails: volunteer.additionalDetails || '',
          userType: 2, // Volunteer
          createdAt: new Date(),
          updatedAt: new Date(),
          requirePasswordChange: true, // Force password change on first login
          isExcelImported: true, // Flag to track Excel imports
          ...coordinates
        };

        await db.collection('user').doc(firebaseUser.uid).set(userData);
        
        results.created++;
        console.log(`Successfully created volunteer: ${volunteer.firstName} ${volunteer.lastName}`);

      } catch (error) {
        console.error(`Error creating volunteer ${volunteer.firstName} ${volunteer.lastName}:`, error);
        results.errors.push(`${volunteer.firstName} ${volunteer.lastName}: ${error.message}`);
      }
    }

    // Return results
    if (results.created === 0 && results.errors.length > 0) {
      results.success = false;
      results.message = 'לא הצלחנו להוסיף אף מתנדב';
    } else if (results.errors.length > 0) {
      results.message = `${results.created} מתנדבים נוספו בהצלחה, ${results.errors.length} שגיאות`;
    } else {
      results.message = `${results.created} מתנדבים נוספו בהצלחה!`;
    }

    res.json(results);

  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'שגיאה בשרת', 
      message: error.message 
    });
  }
});

// PUT /api/users/:id/password-changed - Update password change requirement
router.put('/:id/password-changed', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Update user document to remove password change requirement
    await db.collection('user').doc(userId).update({
      requirePasswordChange: false,
      passwordLastChanged: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Password change requirement removed for user: ${userId}`);
    res.json({ 
      success: true, 
      message: 'Password change requirement updated successfully' 
    });
    
  } catch (error) {
    console.error('Error updating password change requirement:', error);
    res.status(500).json({ 
      error: 'Failed to update password change requirement',
      details: error.message 
    });
  }
});

// GET /api/users/:id/password-status - Check if user still has default password
router.get('/:id/password-status', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user document from Firestore
    const userDoc = await db.collection('user').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Check if user still requires password change
    const stillRequiresChange = userData.requirePasswordChange === true;
    const hasDefaultPassword = !userData.passwordLastChanged;
    
    res.json({
      requiresPasswordChange: stillRequiresChange,
      hasDefaultPassword: hasDefaultPassword,
      isExcelImported: userData.isExcelImported || false,
      passwordLastChanged: userData.passwordLastChanged || null
    });
    
  } catch (error) {
    console.error('Error checking password status:', error);
    res.status(500).json({ 
      error: 'Failed to check password status',
      details: error.message 
    });
  }
});

export default router;
