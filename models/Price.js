const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Price = sequelize.define(
  "Price",
  {
    price_id: {
      type: DataTypes.INTEGER(10),
      primaryKey: true,
			autoIncrement: true,
      allowNull: false,
    },
    effectivity_date: {
      type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
      allowNull: false,
    },
		item_code: {
			type: DataTypes.STRING(15),
			allowNull: false,
		},
		unit_cost: {
			type: DataTypes.DECIMAL(6,2),
			allowNull: false,
		},
		markup_price: {
			type: DataTypes.DECIMAL(4,2),
			allowNull: false,
		},
		retail_price: {
			type: DataTypes.DECIMAL(6,2),
			allowNull: false,
		}
  },
  {
    tableName: "tbl_prices",
    timestamps: false,
    underscored: true, // optional: if you want snake_case mapping
  }
);

module.exports = Price;
