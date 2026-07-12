const express = require('express');
const rateLimit = require('express-rate-limit');
const roadmapController = require('../controllers/roadmap.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationValidator } = require('../validators/common.validator');
const {
  generateRoadmapValidator,
  updateItemValidator,
  mongoIdParamValidator,
  itemIdParamValidator,
} = require('../validators/roadmap.validator');

const router = express.Router();

router.use(protect);

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many roadmap generation requests. Please try again later.' },
});

router.post('/', aiLimiter, generateRoadmapValidator, validate, roadmapController.generateRoadmap);
router.get('/', paginationValidator, validate, roadmapController.getUserRoadmaps);
router.get('/:id', mongoIdParamValidator, validate, roadmapController.getRoadmapById);
router.patch(
  '/:id/items/:itemId',
  [...mongoIdParamValidator, ...itemIdParamValidator, ...updateItemValidator],
  validate,
  roadmapController.updateItemProgress
);
router.delete('/:id', mongoIdParamValidator, validate, roadmapController.deleteRoadmap);

module.exports = router;
