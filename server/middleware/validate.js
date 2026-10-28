const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  const error = ApiError.badRequest(details[0]?.message || 'Please check the submitted fields', details);
  return next(error);
}

module.exports = validate;
