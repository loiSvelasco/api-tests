const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Account = sequelize.define(
  "Account",
  {
    account_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "accounts",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id']
      },
      {
        unique: true,
        fields: ['username']
      }
    ]
  }
);

module.exports = Account;