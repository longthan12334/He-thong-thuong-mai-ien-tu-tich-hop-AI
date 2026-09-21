'use strict';
/** payments — Giao dịch thanh toán, một đơn có thể có nhiều lần thử */
module.exports = (sequelize, DataTypes) => sequelize.define('payments', {
  payment_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.BIGINT, allowNull: false },
  payment_method: { type: DataTypes.STRING(30), allowNull: false },
  provider_name: DataTypes.STRING(50),
  transaction_code: { type: DataTypes.STRING(100), unique: true },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  currency: { type: DataTypes.STRING(3), defaultValue: 'VND' },
  payment_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'INITIATED' },
  paid_at: DataTypes.DATE,
  gateway_response: DataTypes.JSON,
});
