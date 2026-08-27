'use strict';
const express = require('express');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authenticate');
const { registerRules, loginRules, refreshRules } = require('../validators/auth.validator');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// --- Công khai ---
router.post('/register', registerLimiter, registerRules, validate, ctrl.register);
router.post('/login', loginLimiter, loginRules, validate, ctrl.login);
router.post('/refresh', refreshRules, validate, ctrl.refresh);
router.post('/logout', refreshRules, validate, ctrl.logout);

// --- Cần đăng nhập ---
router.get('/me', authenticate, ctrl.me);
router.post('/logout-all', authenticate, ctrl.logoutAll);

module.exports = router;
