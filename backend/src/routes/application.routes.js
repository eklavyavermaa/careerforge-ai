const express = require('express');
const applicationController = require('../controllers/application.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createApplicationValidator,
  updateApplicationValidator,
  updateStatusValidator,
  listApplicationsValidator,
  mongoIdParamValidator,
} = require('../validators/application.validator');

const router = express.Router();

router.use(protect);

// NOTE: /stats must be declared before /:id so it isn't swallowed by the param route.
router.get('/stats', applicationController.getApplicationStats);

router.post('/', createApplicationValidator, validate, applicationController.createApplication);
router.get('/', listApplicationsValidator, validate, applicationController.getUserApplications);
router.get('/:id', mongoIdParamValidator, validate, applicationController.getApplicationById);
router.patch(
  '/:id',
  [...mongoIdParamValidator, ...updateApplicationValidator],
  validate,
  applicationController.updateApplication
);
router.patch(
  '/:id/status',
  [...mongoIdParamValidator, ...updateStatusValidator],
  validate,
  applicationController.updateApplicationStatus
);
router.delete('/:id', mongoIdParamValidator, validate, applicationController.deleteApplication);

module.exports = router;
