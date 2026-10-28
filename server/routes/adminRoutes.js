const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminController = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const { idParam, reasonRules } = require('../validators/authValidators');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/dashboard', adminController.dashboard);

router.get('/users', adminController.listUsers);
router.get('/users/:id', idParam, validate, adminController.getUser);
router.patch(
  '/users/:id/status',
  idParam,
  body('accountStatus').isIn(['active', 'suspended']).withMessage('Invalid account status'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate,
  adminController.setUserStatus
);

router.get('/workers', adminController.listWorkers);
router.get('/workers/:id', idParam, validate, adminController.getWorker);
router.patch(
  '/workers/:id/approval',
  idParam,
  body('approvalStatus').isIn(['approved', 'rejected']).withMessage('Invalid approval status'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate,
  adminController.setWorkerApproval
);
router.patch(
  '/workers/:id/status',
  idParam,
  body('accountStatus').isIn(['active', 'suspended']).withMessage('Invalid account status'),
  body('reason').optional().trim().isLength({ max: 500 }),
  validate,
  adminController.setWorkerAccountStatus
);

router.get('/categories', adminController.listCategories);
router.post(
  '/categories',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Category name must be 2-80 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('isActive').optional().isBoolean(),
  validate,
  adminController.createCategory
);
router.patch(
  '/categories/:id',
  idParam,
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('icon').optional().trim().isLength({ max: 50 }),
  body('isActive').optional().isBoolean(),
  validate,
  adminController.updateCategory
);

router.get('/bookings', adminController.listBookings);
router.get('/bookings/stats', adminController.bookingStats);
router.get('/bookings/:id', idParam, validate, adminController.getBooking);
router.patch('/bookings/:id/cancel', idParam, reasonRules, validate, adminController.cancelBooking);

router.get('/audit-logs', adminController.auditLogs);
router.get('/notifications', adminController.adminNotifications);

module.exports = router;
