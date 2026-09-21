'use strict';
const { query } = require('express-validator');
const { GRANULARITY } = require('../../shared/utils/sqlDialect');

const rangeRules = [
  query('from').optional().isISO8601().withMessage('from phải theo định dạng YYYY-MM-DD'),
  query('to').optional().isISO8601().withMessage('to phải theo định dạng YYYY-MM-DD'),
];

const seriesRules = [
  ...rangeRules,
  query('granularity').optional().isIn(Object.values(GRANULARITY))
    .withMessage('granularity chỉ nhận day, week hoặc month'),
];

const rankingRules = [
  ...rangeRules,
  query('limit').optional().isInt({ min: 1, max: 50 })
    .withMessage('limit trong khoảng 1 đến 50').toInt(),
];

const exportRules = [
  ...rangeRules,
  query('type').optional().isIn(['orders', 'revenue', 'products'])
    .withMessage('type chỉ nhận orders, revenue hoặc products'),
];

module.exports = { rangeRules, seriesRules, rankingRules, exportRules };
