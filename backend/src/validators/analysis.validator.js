const { body, param, query } = require('express-validator');

exports.analyzeResumeValidator = [
  body('resumeId').isMongoId().withMessage('A valid resumeId is required.'),
  body('jobDescription')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Job description must be under 10,000 characters.'),
];

exports.mongoIdParamValidator = [param('id').isMongoId().withMessage('Invalid analysis ID.')];

exports.resumeIdParamValidator = [param('resumeId').isMongoId().withMessage('Invalid resume ID.')];

exports.listAnalysesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
];
