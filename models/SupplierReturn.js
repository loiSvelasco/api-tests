const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SupplierReturn = sequelize.define(
  "SupplierReturn",
  {
    supplier_return_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    delivery_detail_id: {
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
    tableName: "supplier_returns",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['supplier_id', 'delivery_detail_id', 'account_id']
      }
    ]
  }
);

module.exports = SupplierReturn;