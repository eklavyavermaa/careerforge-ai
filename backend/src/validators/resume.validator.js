const { body, param, query } = require('express-validator');

exports.mongoIdParamValidator = [param('id').isMongoId().withMessage('Invalid resume ID.')];

exports.uploadResumeValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Title must be under 150 characters.'),
];

exports.updateTitleValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required.')
    .isLength({ max: 150 })
    .withMessage('Title must be under 150 characters.'),
];

exports.listResumesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
];
