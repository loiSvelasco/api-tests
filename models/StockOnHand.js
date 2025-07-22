const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StockOnHand = sequelize.define(
  "StockOnHand",
  {
    stock_on_hand_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    number_of_box: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.DOUBLE(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "stock_on_hand",
    timestamps: false,
    underscored: true,
  }
);

module.exports = StockOnHand;