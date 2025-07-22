const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SupplierReturnLog = sequelize.define(
  "SupplierReturnLog",
  {
    supplier_returns_logs_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    supplier_return_id: {
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
    tableName: "supplier_returns_logs",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['supplier_return_id', 'account_id']
      }
    ]
  }
);

module.exports = SupplierReturnLog;