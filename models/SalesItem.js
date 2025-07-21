const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SalesItem = sequelize.define(
  "SalesItem",
  {
    salesitem_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    sales_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
		item_code: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
		box: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
		quantity: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false,
    },
		unit_cost: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: false,
    },
		amount: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: false,
    },
		discount: {
      type: DataTypes.DECIMAL(3,2),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_salesitem",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = SalesItem;
