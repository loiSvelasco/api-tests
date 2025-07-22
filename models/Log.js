const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Log = sequelize.define(
  "Log",
  {
    log_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    event: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "logs",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['account_id']
      }
    ]
  }
);

module.exports = Log;