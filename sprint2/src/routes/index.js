'use strict';
const express = require('express');
const authRoutes = require('./auth.routes');
const demoRoutes = require('./demo.routes');

const router = express.Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'API đang hoạt động', data: { uptime: process.uptime() } }));

router.use('/auth', authRoutes);
router.use('/demo', demoRoutes);

module.exports = router;
