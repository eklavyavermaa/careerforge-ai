const express = require('express');
const rateLimit = require('express-rate-limit');
const analysisController = require('../controllers/analysis.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  analyzeResumeValidator,
  mongoIdParamValidator,
  resumeIdParamValidator,
  listAnalysesValidator,
} = require('../validators/analysis.validator');

const router = express.Router();

// Every analysis route requires a logged-in user.
router.use(protect);

// AI calls are the most expensive operation in the app - keep them well below
// Gemini's own rate limits and prevent abuse/cost blowout.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many analysis requests. Please try again later.' },
});

router.post('/', aiLimiter, analyzeResumeValidator, validate, analysisController.analyzeResume);

router.get('/', listAnalysesValidator, validate, analysisController.getUserAnalyses);

router.get(
  '/resume/:resumeId',
  resumeIdParamValidator,
  listAnalysesValidator,
  validate,
  analysisController.getAnalysesForResume
);

router.get('/:id', mongoIdParamValidator, validate, analysisController.getAnalysisById);

module.exports = router;
