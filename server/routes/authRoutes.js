const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiters');
const {
  registerCustomerRules,
  registerWorkerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
} = require('../validators/authValidators');
const { ROLES } = require('../utils/constants');

router.post('/register', registerLimiter, registerCustomerRules, validate, authController.registerCustomer);

router.post(
  '/register/worker',
  registerLimiter,
  uploadProfilePhoto,
  registerWorkerRules,
  validate,
  authController.registerWorker
);

router.post('/login', authLimiter, loginRules, validate, authController.loginHandler(ROLES.CUSTOMER));
router.post('/login/worker', authLimiter, loginRules, validate, authController.loginHandler(ROLES.WORKER));
router.post('/login/admin', authLimiter, loginRules, validate, authController.loginHandler(ROLES.ADMIN));

router.get('/me', authenticate, authController.me);
router.post('/logout', authController.logout);

router.post('/forgot-password', passwordResetLimiter, forgotPasswordRules, validate, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordRules, validate, authController.resetPassword);
router.patch('/password', authenticate, changePasswordRules, validate, authController.changePassword);

module.exports = router;
