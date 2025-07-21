const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Delivery = sequelize.define(
  "Delivery",
  {
    delivery_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    dr_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_deliveries",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Delivery;
