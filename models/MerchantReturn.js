const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MerchantReturn = sequelize.define(
  "MerchantReturn",
  {
    merchant_return_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    merchant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    number_of_box: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "merchant_returns",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['merchant_id', 'order_id', 'account_id']
      }
    ]
  }
);

module.exports = MerchantReturn;