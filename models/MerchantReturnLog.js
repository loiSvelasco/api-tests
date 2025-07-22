const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MerchantReturnLog = sequelize.define(
  "MerchantReturnLog",
  {
    merchant_returns_logs_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    merchant_return_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "merchant_returns_logs",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['merchant_return_id', 'account_id']
      }
    ]
  }
);

module.exports = MerchantReturnLog;