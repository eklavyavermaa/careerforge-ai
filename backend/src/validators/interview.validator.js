const { body } = require('express-validator');
const { mongoIdParam } = require('./common.validator');

exports.startSessionValidator = [
  body('targetRole').trim().notEmpty().withMessage('targetRole is required.').isLength({ max: 150 }),
  body('experienceLevel')
    .optional()
    .isIn(['student', 'fresher', 'junior', 'mid', 'senior'])
    .withMessage('Invalid experienceLevel.'),
  body('categories').optional().isArray({ min: 1 }).withMessage('categories must be a non-empty array.'),
  body('categories.*').optional().isIn(['hr', 'technical', 'behavioral']).withMessage('Invalid category.'),
  body('count').optional().isInt({ min: 3, max: 10 }).withMessage('count must be between 3 and 10.'),
];

exports.submitAnswerValidator = [
  body('answer').trim().notEmpty().withMessage('answer is required.').isLength({ max: 5000 }),
];

exports.mongoIdParamValidator = mongoIdParam('id');
exports.questionIdParamValidator = mongoIdParam('questionId');
