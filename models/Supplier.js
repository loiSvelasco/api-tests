const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Supplier = sequelize.define(
  "Supplier",
  {
    supplier_id: {
      type: DataTypes.INTEGER(11),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
		address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
		contact_number: {
      type: DataTypes.STRING(11),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_supplier",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Supplier;
