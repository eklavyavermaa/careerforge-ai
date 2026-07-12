const { body, query } = require('express-validator');
const { mongoIdParam } = require('./common.validator');

const STATUS_VALUES = [
  'wishlist',
  'applied',
  'oa_assessment',
  'interview_scheduled',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
];

exports.createApplicationValidator = [
  body('company').trim().notEmpty().withMessage('company is required.').isLength({ max: 150 }),
  body('role').trim().notEmpty().withMessage('role is required.').isLength({ max: 150 }),
  body('jobUrl').optional({ nullable: true }).trim().isURL().withMessage('jobUrl must be a valid URL.'),
  body('location').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('salaryRange').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('resume').optional({ nullable: true }).isMongoId().withMessage('Invalid resume ID.'),
  body('coverLetter').optional({ nullable: true }).trim().isLength({ max: 10000 }),
  body('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status.'),
  body('appliedDate').optional({ nullable: true }).isISO8601().withMessage('appliedDate must be a valid date.'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
];

exports.updateApplicationValidator = [
  body('company').optional().trim().notEmpty().isLength({ max: 150 }),
  body('role').optional().trim().notEmpty().isLength({ max: 150 }),
  body('jobUrl').optional({ nullable: true }).trim().isURL().withMessage('jobUrl must be a valid URL.'),
  body('location').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('salaryRange').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('resume').optional({ nullable: true }).isMongoId().withMessage('Invalid resume ID.'),
  body('coverLetter').optional({ nullable: true }).trim().isLength({ max: 10000 }),
  body('appliedDate').optional({ nullable: true }).isISO8601().withMessage('appliedDate must be a valid date.'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
];

exports.updateStatusValidator = [
  body('status').isIn(STATUS_VALUES).withMessage('Invalid status.'),
  body('note').optional({ nullable: true }).trim().isLength({ max: 500 }),
];

exports.listApplicationsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(STATUS_VALUES).withMessage('Invalid status filter.'),
  query('search').optional().trim().isLength({ max: 100 }),
  query('sortBy').optional().isIn(['createdAt', 'appliedDate', 'company']),
  query('order').optional().isIn(['asc', 'desc']),
];

exports.mongoIdParamValidator = mongoIdParam('id');
