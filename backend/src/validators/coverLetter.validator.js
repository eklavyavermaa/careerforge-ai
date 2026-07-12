const { body } = require('express-validator');
const { mongoIdParam } = require('./common.validator');

exports.generateCoverLetterValidator = [
  body('resumeId').isMongoId().withMessage('A valid resumeId is required.'),
  body('jobDescription')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Job description must be under 10,000 characters.'),
  body('companyName').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('roleTitle').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('tone')
    .optional()
    .isIn(['formal', 'concise', 'friendly', 'enthusiastic'])
    .withMessage('Invalid tone.'),
];

exports.mongoIdParamValidator = mongoIdParam('id');
