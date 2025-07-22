const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeliveryDetail = sequelize.define(
  "DeliveryDetail",
  {
    delivery_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      allowNull: false,
      defaultValue: 0,
    },
    actual_weight: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
    },
    capital: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "delivery_details",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['delivery_id', 'item_id']
      }
    ]
  }
);

module.exports = DeliveryDetail;