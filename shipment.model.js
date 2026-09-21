'use strict';
/** shipments — Vận đơn gắn với một đơn hàng */
module.exports = (sequelize, DataTypes) => sequelize.define('shipments', {
  shipment_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.BIGINT, allowNull: false },
  carrier_id: { type: DataTypes.INTEGER, allowNull: false },
  tracking_code: { type: DataTypes.STRING(80), unique: true },
  shipment_status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'CREATED' },
  shipping_fee: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  estimated_delivery_date: DataTypes.DATEONLY,
  delivered_at: DataTypes.DATE,
});
