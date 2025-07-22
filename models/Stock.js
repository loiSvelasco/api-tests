const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Stock = sequelize.define(
  "Stock",
  {
    stock_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    delivery_detail_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    active_markup: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    active_selling_price: {
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
    tableName: "stocks",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['delivery_detail_id', 'account_id']
      }
    ]
  }
);

module.exports = Stock;