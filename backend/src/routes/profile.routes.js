const express = require('express');
const profileController = require('../controllers/profile.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { updateProfileValidator } = require('../validators/profile.validator');

const router = express.Router();

router.use(protect);

router.get('/', profileController.getMyProfile);
router.patch('/', updateProfileValidator, validate, profileController.updateMyProfile);

module.exports = router;
