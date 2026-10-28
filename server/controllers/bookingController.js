const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');

const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Booking request sent successfully.',
    data: { booking },
  });
});

const myBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listCustomerBookings(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const workerBookings = asyncHandler(async (req, res) => {
  const result = await bookingService.listWorkerBookings(req.user._id, req.query);
  res.json({ success: true, data: result });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  res.json({ success: true, data: { booking } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user, req.body.reason, 'customer');
  res.json({ success: true, message: 'Booking cancelled.', data: { booking } });
});

const addReview = asyncHandler(async (req, res) => {
  const review = await bookingService.addReview(req.params.id, req.user._id, req.body.rating, req.body.comment);
  res.status(201).json({
    success: true,
    message: 'Thank you for your review.',
    data: { review },
  });
});

const workerAccept = asyncHandler(async (req, res) => {
  const booking = await bookingService.workerAccept(req.params.id, req.user._id);
  res.json({ success: true, message: 'Booking accepted.', data: { booking } });
});

const workerReject = asyncHandler(async (req, res) => {
  const booking = await bookingService.workerReject(req.params.id, req.user._id, req.body.reason);
  res.json({ success: true, message: 'Booking rejected.', data: { booking } });
});

const workerStart = asyncHandler(async (req, res) => {
  const booking = await bookingService.workerStart(req.params.id, req.user._id);
  res.json({ success: true, message: 'Job marked as in progress.', data: { booking } });
});

const workerComplete = asyncHandler(async (req, res) => {
  const booking = await bookingService.workerComplete(req.params.id, req.user._id);
  res.json({ success: true, message: 'Job completed.', data: { booking } });
});

const workerCancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user, req.body.reason, 'worker');
  res.json({ success: true, message: 'Booking cancelled.', data: { booking } });
});

module.exports = {
  createBooking,
  myBookings,
  workerBookings,
  getBooking,
  cancelBooking,
  addReview,
  workerAccept,
  workerReject,
  workerStart,
  workerComplete,
  workerCancel,
};
