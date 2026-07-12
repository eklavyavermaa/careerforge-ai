const express = require('express');
const rateLimit = require('express-rate-limit');
const resumeController = require('../controllers/resume.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const uploadResumeFile = require('../middleware/uploadResume');
const {
  uploadResumeValidator,
  updateTitleValidator,
  listResumesValidator,
  mongoIdParamValidator,
} = require('../validators/resume.validator');

const router = express.Router();

// Every resume route requires a logged-in user.
router.use(protect);

// Uploads hit Cloudinary + PDF parsing, so keep them tightly rate-limited.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many resume uploads. Please try again later.' },
});

router.post(
  '/',
  uploadLimiter,
  uploadResumeFile('resume'),
  uploadResumeValidator,
  validate,
  resumeController.uploadResume
);

router.get('/', listResumesValidator, validate, resumeController.getUserResumes);

router.get('/:id', mongoIdParamValidator, validate, resumeController.getResumeById);

router.get('/:id/versions', mongoIdParamValidator, validate, resumeController.getVersionHistory);

router.patch(
  '/:id',
  mongoIdParamValidator,
  updateTitleValidator,
  validate,
  resumeController.updateResumeTitle
);

router.delete('/:id', mongoIdParamValidator, validate, resumeController.deleteResume);

module.exports = router;
