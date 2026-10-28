const { body, param, query } = require('express-validator');

const emailRule = body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address')
  .normalizeEmail()
  .isLength({ max: 160 });

const passwordRule = body('password')
  .isString()
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be between 8 and 72 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain at least one letter')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

const phoneRule = body('phone')
  .trim()
  .matches(/^[+0-9()\-\s]{7,25}$/)
  .withMessage('Enter a valid phone number');

const nameRule = body('name')
  .trim()
  .isLength({ min: 2, max: 80 })
  .withMessage('Full name must be between 2 and 80 characters');

const registerCustomerRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  body('city').trim().notEmpty().withMessage('City is required').isLength({ max: 80 }),
  body('locality').trim().notEmpty().withMessage('Locality or area is required').isLength({ max: 120 }),
];

const registerWorkerRules = [
  nameRule,
  emailRule,
  phoneRule,
  passwordRule,
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== undefined && value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
  body('profession').isMongoId().withMessage('Choose a valid profession'),
  body('experienceYears').isInt({ min: 0, max: 60 }).withMessage('Experience must be between 0 and 60 years'),
  body('city').trim().notEmpty().withMessage('City is required').isLength({ max: 80 }),
  body('locality').trim().notEmpty().withMessage('Locality or service area is required').isLength({ max: 120 }),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1200 })
    .withMessage('Description must be between 20 and 1200 characters'),
  body('serviceCharge')
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Enter a valid expected service charge'),
  body('workingHoursStart').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('workingHoursEnd').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('serviceAreas').optional().isString().isLength({ max: 500 }),
  body('additionalServices').optional().isString().isLength({ max: 1000 }),
  body('availabilityDays').optional().isString().isLength({ max: 200 }),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [emailRule];

const resetPasswordRules = [
  body('token').isString().isLength({ min: 32, max: 200 }).withMessage('Reset token is invalid'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('New password must be between 8 and 72 characters')
    .matches(/[A-Za-z]/)
    .withMessage('New password must contain at least one letter')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

const createBookingRules = [
  body('workerId').isMongoId().withMessage('Choose a valid professional'),
  body('serviceCategoryId').isMongoId().withMessage('Choose a valid service'),
  body('serviceDescription')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Describe the problem in at least 10 characters'),
  body('appointmentDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Choose a valid appointment date'),
  body('appointmentTime')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Choose a valid appointment time'),
  body('serviceAddress').trim().isLength({ min: 5, max: 300 }).withMessage('Enter the full service address'),
  body('city').trim().notEmpty().withMessage('City is required').isLength({ max: 80 }),
  body('locality').trim().notEmpty().withMessage('Locality is required').isLength({ max: 120 }),
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Enter the contact name'),
  body('customerPhone')
    .trim()
    .matches(/^[+0-9()\-\s]{7,25}$/)
    .withMessage('Enter a valid contact phone number'),
  body('additionalNotes').optional().trim().isLength({ max: 1000 }),
];

const reasonRules = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason is too long'),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 800 }).withMessage('Review is too long'),
];

const updateWorkerProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().trim().matches(/^[+0-9()\-\s]{7,25}$/).withMessage('Enter a valid phone number'),
  body('city').optional().trim().isLength({ min: 1, max: 80 }),
  body('locality').optional().trim().isLength({ min: 1, max: 120 }),
  body('profession').optional().isMongoId().withMessage('Invalid profession'),
  body('experienceYears').optional().isInt({ min: 0, max: 60 }),
  body('description').optional().trim().isLength({ max: 1200 }),
  body('serviceCharge').optional().isFloat({ min: 0, max: 1000000 }),
];

const idParam = [param('id').isMongoId().withMessage('Invalid identifier')];

module.exports = {
  registerCustomerRules,
  registerWorkerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
  createBookingRules,
  reasonRules,
  reviewRules,
  updateWorkerProfileRules,
  idParam,
};
