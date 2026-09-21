'use strict';
/** shops — Gian hàng của người bán */
module.exports = (sequelize, DataTypes) => sequelize.define('shops', {
  shop_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  owner_user_id: { type: DataTypes.BIGINT, unique: true },
  shop_name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  logo_url: DataTypes.STRING(500),
  description: DataTypes.TEXT,
  business_license_no: DataTypes.STRING(50),
  tax_code: DataTypes.STRING(20),
  rating_avg: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  follower_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
  verified_at: DataTypes.DATE,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
