const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    transaction_date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    merchant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_due: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Draft', 'Void'),
      allowNull: false,
      defaultValue: 'Draft',
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "transactions",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['merchant_id', 'account_id']
      }
    ]
  }
);

module.exports = Transaction;