const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PriceLog = sequelize.define(
  "PriceLog",
  {
    price_log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    post_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    active_mark_up: {
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
    tableName: "price_logs",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['stock_id', 'account_id']
      }
    ]
  }
);

module.exports = PriceLog;