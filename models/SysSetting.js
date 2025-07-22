const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SysSetting = sequelize.define(
  "SysSetting",
  {
    sys_setting_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    attribute: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
  },
  {
    tableName: "sys_settings",
    timestamps: false,
    underscored: true,
  }
);

module.exports = SysSetting;