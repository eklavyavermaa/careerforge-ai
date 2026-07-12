const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_FILE_SIZE_MB = Number(process.env.RESUME_MAX_FILE_SIZE_MB) || 5;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = /\.pdf$/i.test(file.originalname || '');

  if (!isPdfMime || !isPdfExt) {
    return cb(new AppError('Only PDF files are allowed for resume uploads.', 422), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

/**
 * Wraps multer's single-file upload so Multer errors (file too large, wrong
 * field name, wrong file type) flow through the app's centralized error
 * handler as AppErrors instead of crashing or returning multer's raw error shape.
 *
 * @param {string} fieldName - the multipart form field name expected to hold the file
 */
module.exports = (fieldName) => (req, res, next) => {
  const handleUpload = upload.single(fieldName);

  handleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, 413));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new AppError(`Unexpected file field. Please upload using the "${fieldName}" field.`, 400));
      }
      return next(new AppError(err.message, 400));
    }

    if (err) return next(err);

    if (!req.file) {
      return next(new AppError(`No resume file was uploaded. Please attach a PDF under the "${fieldName}" field.`, 400));
    }

    next();
  });
};
