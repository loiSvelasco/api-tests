const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Expense = sequelize.define(
  "Expense",
  {
    expense_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payee: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    particulars: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "expenses",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['account_id']
      }
    ]
  }
);

module.exports = Expense;