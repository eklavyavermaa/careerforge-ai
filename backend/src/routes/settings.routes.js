const express = require('express');
const settingsController = require('../controllers/settings.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { updateSettingsValidator } = require('../validators/settings.validator');

const router = express.Router();

router.use(protect);

router.get('/', settingsController.getMySettings);
router.patch('/', updateSettingsValidator, validate, settingsController.updateMySettings);

module.exports = router;
