const express = require('express');
const notificationController = require('../controllers/notification.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { paginationValidator, mongoIdParam } = require('../validators/common.validator');

const router = express.Router();

router.use(protect);

const mongoIdParamValidator = mongoIdParam('id');

router.get('/', paginationValidator, validate, notificationController.getUserNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', mongoIdParamValidator, validate, notificationController.markAsRead);
router.delete('/:id', mongoIdParamValidator, validate, notificationController.deleteNotification);

module.exports = router;
