const express = require('express');
const rateLimit = require('express-rate-limit');
const coverLetterController = require('../controllers/coverLetter.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationValidator } = require('../validators/common.validator');
const {
  generateCoverLetterValidator,
  mongoIdParamValidator,
} = require('../validators/coverLetter.validator');

const router = express.Router();

router.use(protect);

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many cover letter requests. Please try again later.' },
});

router.post('/', aiLimiter, generateCoverLetterValidator, validate, coverLetterController.generateCoverLetter);
router.get('/', paginationValidator, validate, coverLetterController.getUserCoverLetters);
router.get('/:id', mongoIdParamValidator, validate, coverLetterController.getCoverLetterById);
router.delete('/:id', mongoIdParamValidator, validate, coverLetterController.deleteCoverLetter);

module.exports = router;
