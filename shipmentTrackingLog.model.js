'use strict';
/** shipment_tracking_logs — Hành trình vận đơn do đối tác trả về */
module.exports = (sequelize, DataTypes) => sequelize.define('shipment_tracking_logs', {
  log_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  shipment_id: { type: DataTypes.BIGINT, allowNull: false },
  status: { type: DataTypes.STRING(50), allowNull: false },
  location: DataTypes.STRING(200),
  description: DataTypes.STRING(255),
  event_time: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});
