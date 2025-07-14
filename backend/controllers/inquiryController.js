// backend/controllers/inquiryController.js
import db, { admin } from '../services/firebaseAdmin.js';

export const uploadPhotoAndSave = async (inquiryId, fileBuffer, fileName) => {
  try {
    console.log(`📸 Uploading photo for inquiry: ${inquiryId}`);
    
    // Create a reference to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(`inquiry-photos/${inquiryId}/${Date.now()}_${fileName}`);
    
    // Upload the file buffer to Firebase Storage
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'image/jpeg', // Adjust based on file type
        metadata: {
          inquiryId: inquiryId,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    
    // Update the inquiry document with the photo URL
    await db.collection('inquiry').doc(inquiryId).update({ 
      photo: publicUrl,
      photoUploadedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Photo uploaded successfully: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Firebase Storage upload error:', error);
    throw error;
  }
};
