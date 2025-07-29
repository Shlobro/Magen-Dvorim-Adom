const { onCall } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Set global options for all functions
setGlobalOptions({ region: 'us-central1' });

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Callable function for coordinators to delete volunteers completely
exports.deleteVolunteerByCoordinator = onCall(async (request) => {
  const { data, auth } = request;
  try {
    // Verify the user is authenticated
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    // Verify the user is a coordinator (userType === 1)
    const callerUID = auth.uid;
    const callerDoc = await admin.firestore().collection('user').doc(callerUID).get();
    
    if (!callerDoc.exists || callerDoc.data().userType !== 1) {
      throw new Error('Only coordinators can delete volunteers');
    }

    const { volunteerUID } = data;
    
    if (!volunteerUID) {
      throw new Error('volunteerUID is required');
    }

    console.log(`🗑️ Coordinator ${callerUID} deleting volunteer: ${volunteerUID}`);

    // Get volunteer data before deletion
    const volunteerDoc = await admin.firestore().collection('user').doc(volunteerUID).get();
    const volunteerData = volunteerDoc.exists ? volunteerDoc.data() : null;
    
    // Verify the target is actually a volunteer
    if (!volunteerData || volunteerData.userType !== 2) {
      throw new Error('Target user is not a volunteer');
    }

    // 1. Remove volunteer from all inquiries
    const inquiriesSnapshot = await admin.firestore()
      .collection('inquiry')
      .where('assignedVolunteers', 'array-contains', volunteerUID)
      .get();

    const batch = admin.firestore().batch();
    
    inquiriesSnapshot.forEach(doc => {
      const inquiry = doc.data();
      const updatedVolunteers = inquiry.assignedVolunteers.filter(id => id !== volunteerUID);
      batch.update(doc.ref, {
        assignedVolunteers: updatedVolunteers,
        lastModified: admin.firestore.FieldValue.serverTimestamp(),
        deletedVolunteerInfo: {
          name: `${volunteerData.firstName || ''} ${volunteerData.lastName || ''}`.trim(),
          email: volunteerData.email,
          deletedAt: new Date().toISOString(),
          deletedBy: callerUID
        }
      });
    });

    // 2. Delete Firestore document
    batch.delete(admin.firestore().collection('user').doc(volunteerUID));
    
    // Execute batch operations
    await batch.commit();
    console.log(`✅ Removed volunteer from ${inquiriesSnapshot.size} inquiries and deleted Firestore doc`);

    // 3. Delete Firebase Authentication account
    try {
      await admin.auth().deleteUser(volunteerUID);
      console.log(`✅ Deleted Auth account for volunteer: ${volunteerUID}`);
      
      return {
        success: true,
        completeDeletion: true,
        message: 'מתנדב נמחק בהצלחה לחלוטין מהמערכת',
        deletedVolunteer: {
          name: volunteerData.name || `${volunteerData.firstName || ''} ${volunteerData.lastName || ''}`,
          email: volunteerData.email,
          uid: volunteerUID
        },
        inquiriesUnassigned: inquiriesSnapshot.size
      };
      
    } catch (authError) {
      console.error(`⚠️ Failed to delete Auth account:`, authError);
      
      return {
        success: true,
        completeDeletion: false,
        message: 'מתנדב נמחק ממסד הנתונים אך חשבון ההזדהות דורש ניקוי ידני',
        deletedVolunteer: {
          name: volunteerData.name || `${volunteerData.firstName || ''} ${volunteerData.lastName || ''}`,
          email: volunteerData.email,
          uid: volunteerUID
        },
        inquiriesUnassigned: inquiriesSnapshot.size,
        warning: 'חשבון Firebase Authentication דורש מחיקה ידנית',
        cleanupInstructions: {
          email: volunteerData.email,
          uid: volunteerUID,
          steps: [
            'פתח Firebase Console > Authentication > Users',
            `חפש את: ${volunteerData.email}`,
            'מחק את המשתמש ידנית',
            `או השתמש ב-CLI: firebase auth:delete ${volunteerUID}`
          ]
        }
      };
    }

  } catch (error) {
    console.error('Error in deleteVolunteerByCoordinator:', error);
    throw new Error('Internal server error: ' + error.message);
  }
});

// Callable function to get volunteer details (for verification)
exports.getVolunteerDetails = onCall(async (request) => {
  const { data, auth } = request;
  try {
    if (!auth) {
      throw new Error('User must be authenticated');
    }

    const { volunteerUID } = data;
    const volunteerDoc = await admin.firestore().collection('users').doc(volunteerUID).get();
    
    if (!volunteerDoc.exists) {
      throw new Error('Volunteer not found');
    }

    const volunteerData = volunteerDoc.data();
    
    return {
      success: true,
      volunteer: {
        name: volunteerData.name || `${volunteerData.firstName || ''} ${volunteerData.lastName || ''}`,
        email: volunteerData.email,
        userType: volunteerData.userType,
        uid: volunteerUID
      }
    };

  } catch (error) {
    console.error('Error in getVolunteerDetails:', error);
    throw new Error('Internal server error: ' + error.message);
  }
});
