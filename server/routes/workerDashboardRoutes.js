const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');
const { ROLES } = require('../utils/constants');
const { updateWorkerProfileRules, reasonRules, idParam } = require('../validators/authValidators');

router.use(authenticate, authorize(ROLES.WORKER));

router.get('/dashboard', workerController.getDashboard);
router.get('/profile', workerController.getProfile);
router.patch(
  '/profile',
  uploadProfilePhoto,
  updateWorkerProfileRules,
  validate,
  workerController.updateProfile
);
router.patch('/availability', workerController.updateAvailability);

router.get('/bookings', bookingController.workerBookings);
router.patch('/bookings/:id/accept', idParam, validate, bookingController.workerAccept);
router.patch('/bookings/:id/reject', idParam, reasonRules, validate, bookingController.workerReject);
router.patch('/bookings/:id/start', idParam, validate, bookingController.workerStart);
router.patch('/bookings/:id/complete', idParam, validate, bookingController.workerComplete);
router.patch('/bookings/:id/cancel', idParam, reasonRules, validate, bookingController.workerCancel);

module.exports = router;
