const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Delivery = sequelize.define(
  "Delivery",
  {
    delivery_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dr_number: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    delivery_box: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    delivery_weight: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    actual_box: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    actual_weight: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Finalized'),
      allowNull: false,
      defaultValue: 'Draft',
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "deliveries",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['supplier_id', 'account_id']
      }
    ]
  }
);

module.exports = Delivery;