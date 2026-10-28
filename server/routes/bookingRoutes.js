const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createBookingRules, reasonRules, reviewRules, idParam } = require('../validators/authValidators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.post('/', authorize(ROLES.CUSTOMER), createBookingRules, validate, bookingController.createBooking);
router.get('/my', authorize(ROLES.CUSTOMER), bookingController.myBookings);
router.get('/:id', idParam, validate, bookingController.getBooking);
router.patch('/:id/cancel', authorize(ROLES.CUSTOMER), idParam, reasonRules, validate, bookingController.cancelBooking);
router.post('/:id/review', authorize(ROLES.CUSTOMER), idParam, reviewRules, validate, bookingController.addReview);

module.exports = router;
