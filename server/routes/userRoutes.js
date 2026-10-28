const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

router.use(authenticate, authorize(ROLES.CUSTOMER));

router.get('/dashboard', userController.dashboard);
router.patch(
  '/profile',
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().trim().matches(/^[+0-9()\-\s]{7,25}$/).withMessage('Enter a valid phone number'),
  body('city').optional().trim().isLength({ max: 80 }),
  body('locality').optional().trim().isLength({ max: 120 }),
  validate,
  userController.updateProfile
);

module.exports = router;
