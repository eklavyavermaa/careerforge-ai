const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const RESUME_FOLDER = 'careerforge/resumes';

/**
 * Uploads a PDF buffer to Cloudinary as a raw asset via the upload_stream API
 * (no temp files on disk). Rejects with a client-safe AppError on failure so
 * callers don't need to know about Cloudinary's error shape.
 *
 * @param {Buffer} buffer
 * @param {{ public_id?: string }} [options]
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
exports.uploadPdfBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: RESUME_FOLDER,
        format: 'pdf',
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          console.error('[Cloudinary] Upload failed:', error?.message || error);
          return reject(new AppError('Failed to upload resume to storage. Please try again.', 502));
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });

/**
 * Deletes a resume PDF from Cloudinary. Failures are logged, not thrown -
 * a storage cleanup hiccup should never block deleting the DB record the
 * user asked to delete.
 *
 * @param {string} publicId
 */
exports.deletePdf = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete asset "${publicId}":`, err.message);
  }
};
