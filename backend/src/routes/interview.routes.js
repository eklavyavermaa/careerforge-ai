const express = require('express');
const rateLimit = require('express-rate-limit');
const interviewController = require('../controllers/interview.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationValidator } = require('../validators/common.validator');
const {
  startSessionValidator,
  submitAnswerValidator,
  mongoIdParamValidator,
  questionIdParamValidator,
} = require('../validators/interview.validator');

const router = express.Router();

router.use(protect);

// Every route in this module makes at least one Gemini call, so keep it tight.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many interview requests. Please try again later.' },
});

router.post('/', aiLimiter, startSessionValidator, validate, interviewController.startSession);
router.get('/', paginationValidator, validate, interviewController.getUserSessions);
router.get('/:id', mongoIdParamValidator, validate, interviewController.getSessionById);
router.post(
  '/:id/questions/:questionId/answer',
  aiLimiter,
  [...mongoIdParamValidator, ...questionIdParamValidator, ...submitAnswerValidator],
  validate,
  interviewController.submitAnswer
);
router.post('/:id/complete', aiLimiter, mongoIdParamValidator, validate, interviewController.completeSession);
router.delete('/:id', mongoIdParamValidator, validate, interviewController.deleteSession);

module.exports = router;
