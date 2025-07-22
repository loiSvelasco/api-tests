const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentMethod = sequelize.define(
  "PaymentMethod",
  {
    payment_method_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    short_description: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
  },
  {
    tableName: "payment_methods",
    timestamps: false,
    underscored: true,
  }
);

module.exports = PaymentMethod;