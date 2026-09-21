'use strict';
/** categories — Cây danh mục sản phẩm (quan hệ đệ quy) */
module.exports = (sequelize, DataTypes) => sequelize.define('categories', {
  category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_id: DataTypes.INTEGER,
  category_name: { type: DataTypes.STRING(150), allowNull: false },
  slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  icon_url: DataTypes.STRING(500),
  level: { type: DataTypes.SMALLINT, allowNull: false },
  path: { type: DataTypes.STRING(255), allowNull: false },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});
