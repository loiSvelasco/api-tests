const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WarehouseItem = sequelize.define(
  "WarehouseItem",
  {
    warehouseitem_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER(5),
      allowNull: false,
    },
    dr_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    item_code: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    box: {
      type: DataTypes.INTEGER(5),
      allowNull: false,
    },
    weight_delivered: {
      type: DataTypes.FLOAT(8, 5),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.FLOAT(8, 5),
      allowNull: false,
    },
    weight_actual: {
      type: DataTypes.FLOAT(8, 5),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_warehouseitems",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = WarehouseItem;
