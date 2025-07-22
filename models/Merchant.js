const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Merchant = sequelize.define(
  "Merchant",
  {
    merchant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstname: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    business_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    nature: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
  },
  {
    tableName: "merchants",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Merchant;