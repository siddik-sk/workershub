const multer = require('multer');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Please check the submitted fields';
    details = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'The requested resource identifier is invalid';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message =
      field === 'email'
        ? 'An account with this email address already exists'
        : field === 'bookingReference'
          ? 'A booking reference collision occurred. Please try again.'
          : `A record with this ${field} already exists`;
    details = [{ field, message }];
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Profile photo must be smaller than ${Math.round(config.uploadMaxBytes / 1024 / 1024)} MB`
        : 'Could not upload the profile photo';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  }

  if (statusCode >= 500) {
    console.error('Unhandled API error:', err);
    if (!config.isProduction) {
      details = details || { stack: err.stack };
    }
  }

  const payload = {
    success: false,
    error: { code, message },
  };
  if (details) payload.error.details = details;
  if (!config.isProduction && err.stack && statusCode >= 500) payload.error.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = { notFound, errorHandler };
