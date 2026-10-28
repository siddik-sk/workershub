const ApiError = require('../utils/ApiError');

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const output = {};
    Object.keys(value).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) return;
      output[key] = clean(value[key]);
    });
    return output;
  }
  return value;
}

/** Strip Mongo operator keys from user-controlled values (defence in depth). */
function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.params && typeof req.params === 'object') req.params = clean(req.params);
  if (req.query && typeof req.query === 'object') {
    const safeQuery = clean(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, safeQuery);
  }
  next();
}

module.exports = sanitizeRequest;
