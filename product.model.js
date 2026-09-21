'use strict';
/** products — Sản phẩm (thông tin dùng chung, không giữ giá bán thực tế) */
module.exports = (sequelize, DataTypes) => sequelize.define('products', {
  product_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  shop_id: { type: DataTypes.BIGINT, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  brand_id: DataTypes.INTEGER,
  product_name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(280), allowNull: false, unique: true },
  short_description: DataTypes.STRING(500),
  full_description: DataTypes.TEXT,
  base_price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'DRAFT' },
  approval_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
  view_count: { type: DataTypes.BIGINT, defaultValue: 0 },
  sold_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  rating_avg: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  published_at: DataTypes.DATE,
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
