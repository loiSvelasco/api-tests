const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentDetail = sequelize.define(
  "PaymentDetail",
  {
    payment_detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invoice_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount_due: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Void'),
      allowNull: false,
      defaultValue: 'Active',
    },
    remarks: {
      type: DataTypes.STRING(250),
      allowNull: false,
      defaultValue: '',
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "payment_details",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['payment_id', 'payment_method_id', 'account_id']
      }
    ]
  }
);

module.exports = PaymentDetail;