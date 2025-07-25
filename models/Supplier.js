const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Supplier = sequelize.define(
  "Supplier",
  {
    supplier_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    contact_details: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  {
    tableName: "suppliers",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Supplier;