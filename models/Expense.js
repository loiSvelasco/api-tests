const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Expense = sequelize.define(
  "Expense",
  {
    expense_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    payee: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    particulars: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_expenses",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Expense;
