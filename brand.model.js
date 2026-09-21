'use strict';
/** brands — Thương hiệu */
module.exports = (sequelize, DataTypes) => sequelize.define('brands', {
  brand_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  brand_name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(180), unique: true },
  logo_url: DataTypes.STRING(500),
  country: DataTypes.STRING(80),
});
