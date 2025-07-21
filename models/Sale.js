const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Sale = sequelize.define(
  "Sale",
  {
    sales_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    invoice_number: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(6,2),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_sales",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Sale;
