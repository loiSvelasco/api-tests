const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DeliveryItemDetail = sequelize.define(
  "DeliveryItemDetail",
  {
    delivery_item_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    delivery_detail_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    box_code: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    delivery_weight: {
      type: DataTypes.DOUBLE(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    actual_weight: {
      type: DataTypes.DOUBLE(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    undefined: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "delivery_item_details",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['delivery_detail_id']
      }
    ]
  }
);

module.exports = DeliveryItemDetail;