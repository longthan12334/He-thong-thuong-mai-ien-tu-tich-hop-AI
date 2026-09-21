'use strict';
const express = require('express');
const ctrl = require('./auth.controller');
const validate = require('../../shared/middlewares/validate');
const { authenticate } = require('../../shared/middlewares/authenticate');
const { registerRules, loginRules, refreshRules } = require('./auth.validator');
const { loginLimiter, registerLimiter } = require('../../shared/middlewares/rateLimiter');

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
