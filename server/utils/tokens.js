const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { ROLES } = require('./constants');

const AUTH_COOKIE = 'wc_token';

function signAuthToken(user) {
  const expiresIn = user.role === ROLES.ADMIN ? config.adminJwtExpiresIn : config.jwtExpiresIn;
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      tv: user.tokenVersion || 0,
    },
    config.jwtSecret,
    { expiresIn, issuer: 'workconnect', audience: 'workconnect-web' }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    issuer: 'workconnect',
    audience: 'workconnect-web',
  });
}

function cookieOptions(role) {
  const admin = role === ROLES.ADMIN;
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: (admin ? 12 : 7) * 60 * 60 * 1000,
  };
}

function setAuthCookie(res, token, role) {
  res.cookie(AUTH_COOKIE, token, cookieOptions(role));
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

function extractToken(req) {
  if (req.cookies && req.cookies[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

module.exports = {
  AUTH_COOKIE,
  signAuthToken,
  verifyAuthToken,
  setAuthCookie,
  clearAuthCookie,
  extractToken,
};
