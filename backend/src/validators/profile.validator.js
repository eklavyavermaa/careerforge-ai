const { body } = require('express-validator');

exports.updateProfileValidator = [
  body('headline').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('bio').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('location').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('targetRole').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('experienceLevel')
    .optional()
    .isIn(['student', 'fresher', 'junior', 'mid', 'senior'])
    .withMessage('Invalid experienceLevel.'),
  body('skills').optional().isArray().withMessage('skills must be an array.'),
  body('skills.*').optional().isString().trim().isLength({ max: 60 }),
  body('links').optional().isObject().withMessage('links must be an object.'),
  body('links.linkedin').optional({ nullable: true }).trim().isURL().withMessage('Invalid LinkedIn URL.'),
  body('links.github').optional({ nullable: true }).trim().isURL().withMessage('Invalid GitHub URL.'),
  body('links.portfolio').optional({ nullable: true }).trim().isURL().withMessage('Invalid portfolio URL.'),
  body('links.leetcode').optional({ nullable: true }).trim().isURL().withMessage('Invalid LeetCode URL.'),
  body('education').optional().isArray().withMessage('education must be an array.'),
  body('experience').optional().isArray().withMessage('experience must be an array.'),
];
