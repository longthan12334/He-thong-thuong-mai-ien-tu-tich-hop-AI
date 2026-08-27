'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Tin tưởng proxy để req.ip lấy đúng IP thật khi chạy sau Nginx
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.use(env.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
