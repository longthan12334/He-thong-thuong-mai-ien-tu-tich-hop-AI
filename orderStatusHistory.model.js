'use strict';
/** order_status_histories — Vết chuyển trạng thái đơn, chỉ ghi thêm */
module.exports = (sequelize, DataTypes) => sequelize.define('order_status_histories', {
  history_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.BIGINT, allowNull: false },
  from_status: DataTypes.STRING(20),
  to_status: { type: DataTypes.STRING(20), allowNull: false },
  changed_by_user_id: DataTypes.BIGINT,
  note: DataTypes.STRING(255),
  changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});
