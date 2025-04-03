// backend/controllers/inquiryController.js
import cloudinary from '../services/cloudinary.js';
import db from '../services/firebaseAdmin.js';

export const uploadPhotoAndSave = async (inquiryId, fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'inquiries' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        try {
          await db.collection('inquiry').doc(inquiryId).set({ photo: result.secure_url }, { merge: true });
          resolve(result.secure_url);
        } catch (err) {
          reject(err);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};
