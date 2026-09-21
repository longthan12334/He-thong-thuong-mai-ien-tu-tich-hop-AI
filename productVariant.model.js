'use strict';
/**
 * product_variants — Biến thể sản phẩm (SKU).
 * Mọi giao dịch mua bán và mọi bản ghi tồn kho tham chiếu tới variant_id,
 * không tham chiếu product_id.
 */
module.exports = (sequelize, DataTypes) => sequelize.define('product_variants', {
  variant_id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.BIGINT, allowNull: false },
  sku_code: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  variant_name: { type: DataTypes.STRING(200), allowNull: false },
  price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  sale_price: DataTypes.DECIMAL(15, 2),
  image_url: DataTypes.STRING(500),
  weight_gram: DataTypes.INTEGER,
  barcode: DataTypes.STRING(50),
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
