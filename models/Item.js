const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Item = sequelize.define(
  "Item",
  {
    item_id: {
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
    category: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(250),
      allowNull: false,
      defaultValue: 'Kgs',
    },
    reorder_level_upper: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorder_level_lower: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "items",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Item;