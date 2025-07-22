const sequelize = require('../config/database');

// Import all models
const Account = require('./Account');
const Delivery = require('./Delivery');
const DeliveryDetail = require('./DeliveryDetail');
const DeliveryItemDetail = require('./DeliveryItemDetail');
const Employee = require('./Employee');
const Expense = require('./Expense');
const Item = require('./Item');
const Log = require('./Log');
const Merchant = require('./Merchant');
const MerchantReturn = require('./MerchantReturn');
const MerchantReturnLog = require('./MerchantReturnLog');
const Order = require('./Order');
const Payment = require('./Payment');
const PaymentDetail = require('./PaymentDetail');
const PaymentMethod = require('./PaymentMethod');
const PriceLog = require('./PriceLog');
const Stock = require('./Stock');
const StockOnHand = require('./StockOnHand');
const Supplier = require('./Supplier');
const SupplierReturn = require('./SupplierReturn');
const SupplierReturnLog = require('./SupplierReturnLog');
const SysSetting = require('./SysSetting');
const Transaction = require('./Transaction');

// Define associations
const defineAssociations = () => {
  // Employee - Account relationship
  Employee.hasOne(Account, { foreignKey: 'employee_id', as: 'account' });
  Account.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

  // Supplier - Delivery relationship
  Supplier.hasMany(Delivery, { foreignKey: 'supplier_id', as: 'deliveries' });
  Delivery.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

  // Account - Delivery relationship
  Account.hasMany(Delivery, { foreignKey: 'account_id', as: 'deliveries' });
  Delivery.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  // Delivery - DeliveryDetail relationship
  Delivery.hasMany(DeliveryDetail, { foreignKey: 'delivery_id', as: 'deliveryDetails' });
  DeliveryDetail.belongsTo(Delivery, { foreignKey: 'delivery_id', as: 'delivery' });

  // Item - DeliveryDetail relationship
  Item.hasMany(DeliveryDetail, { foreignKey: 'item_id', as: 'deliveryDetails' });
  DeliveryDetail.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

  // DeliveryDetail - DeliveryItemDetail relationship
  DeliveryDetail.hasMany(DeliveryItemDetail, { foreignKey: 'delivery_detail_id', as: 'deliveryItemDetails' });
  DeliveryItemDetail.belongsTo(DeliveryDetail, { foreignKey: 'delivery_detail_id', as: 'deliveryDetail' });

  // DeliveryDetail - Stock relationship
  DeliveryDetail.hasMany(Stock, { foreignKey: 'delivery_detail_id', as: 'stocks' });
  Stock.belongsTo(DeliveryDetail, { foreignKey: 'delivery_detail_id', as: 'deliveryDetail' });

  // Account - Stock relationship
  Account.hasMany(Stock, { foreignKey: 'account_id', as: 'stocks' });
  Stock.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  // Stock - StockOnHand relationship
  Stock.hasOne(StockOnHand, { foreignKey: 'stock_id', as: 'stockOnHand' });
  StockOnHand.belongsTo(Stock, { foreignKey: 'stock_id', as: 'stock' });

  // Merchant - Transaction relationship
  Merchant.hasMany(Transaction, { foreignKey: 'merchant_id', as: 'transactions' });
  Transaction.belongsTo(Merchant, { foreignKey: 'merchant_id', as: 'merchant' });

  // Account - Transaction relationship
  Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });
  Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  // Transaction - Order relationship
  Transaction.hasMany(Order, { foreignKey: 'transaction_id', as: 'orders' });
  Order.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

  // Stock - Order relationship
  Stock.hasMany(Order, { foreignKey: 'stock_id', as: 'orders' });
  Order.belongsTo(Stock, { foreignKey: 'stock_id', as: 'stock' });

  // Transaction - Payment relationship
  Transaction.hasOne(Payment, { foreignKey: 'transaction_id', as: 'payment' });
  Payment.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

  // Payment - PaymentDetail relationship
  Payment.hasMany(PaymentDetail, { foreignKey: 'payment_id', as: 'paymentDetails' });
  PaymentDetail.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

  // PaymentMethod - PaymentDetail relationship
  PaymentMethod.hasMany(PaymentDetail, { foreignKey: 'payment_method_id', as: 'paymentDetails' });
  PaymentDetail.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });

  // Account - PaymentDetail relationship
  Account.hasMany(PaymentDetail, { foreignKey: 'account_id', as: 'paymentDetails' });
  PaymentDetail.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  // Additional associations for logs and returns
  Account.hasMany(Log, { foreignKey: 'account_id', as: 'logs' });
  Log.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  Account.hasMany(Expense, { foreignKey: 'account_id', as: 'expenses' });
  Expense.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

  Stock.hasMany(PriceLog, { foreignKey: 'stock_id', as: 'priceLogs' });
  PriceLog.belongsTo(Stock, { foreignKey: 'stock_id', as: 'stock' });

  Account.hasMany(PriceLog, { foreignKey: 'account_id', as: 'priceLogs' });
  PriceLog.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });
};

// Initialize associations
defineAssociations();

// Export database object
const db = {
  sequelize,
  Account,
  Delivery,
  DeliveryDetail,
  DeliveryItemDetail,
  Employee,
  Expense,
  Item,
  Log,
  Merchant,
  MerchantReturn,
  MerchantReturnLog,
  Order,
  Payment,
  PaymentDetail,
  PaymentMethod,
  PriceLog,
  Stock,
  StockOnHand,
  Supplier,
  SupplierReturn,
  SupplierReturnLog,
  SysSetting,
  Transaction,
};

module.exports = db;