const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationValidator } = require('../validators/common.validator');

const router = express.Router();

router.use(protect);

router.get('/summary', analyticsController.getDashboardSummary);
router.get('/weekly-progress', analyticsController.getWeeklyProgress);
router.get('/recent-activity', paginationValidator, validate, analyticsController.getRecentActivity);

module.exports = router;
