const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Setting = sequelize.define(
  "Setting",
  {
    setting_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    attribute: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
		value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_settings",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Setting;
