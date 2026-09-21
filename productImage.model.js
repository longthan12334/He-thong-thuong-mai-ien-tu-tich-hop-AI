'use strict';
/** product_images — Ảnh sản phẩm */
module.exports = (sequelize, DataTypes) => sequelize.define('product_images', {
  image_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  image_url: { type: DataTypes.STRING(500), allowNull: false },
  alt_text: DataTypes.STRING(255),
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
});
