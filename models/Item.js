const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Item = sequelize.define(
  "Item",
  {
    item_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    short_desc: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
		reorder_max_level: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
    reorder_min_level: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_items",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Item;
