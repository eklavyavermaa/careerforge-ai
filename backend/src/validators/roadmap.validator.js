const { body } = require('express-validator');
const { mongoIdParam } = require('./common.validator');

exports.generateRoadmapValidator = [
  body('targetRole').trim().notEmpty().withMessage('targetRole is required.').isLength({ max: 150 }),
  body('resumeId').optional({ nullable: true }).isMongoId().withMessage('Invalid resumeId.'),
];

exports.updateItemValidator = [body('isCompleted').isBoolean().withMessage('isCompleted must be a boolean.')];

exports.mongoIdParamValidator = mongoIdParam('id');
exports.itemIdParamValidator = mongoIdParam('itemId');
