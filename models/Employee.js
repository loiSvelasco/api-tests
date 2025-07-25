const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Employee = sequelize.define(
  "Employee",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    firstname: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "employees",
    timestamps: false,
    underscored: true,
  }
);

module.exports = Employee;