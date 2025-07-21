const sequelize = require('../config/database');
const Supplier = require('./Supplier');
const User = require('./user');
const WarehouseItem = require('./WarehouseItem');
const Setting = require('./Setting');
const SalesItem = require('./SalesItem');
const Sale = require('./Sale');
const Price = require('./Price');
const Item = require('./Item');
const Expense = require('./Expense');
const Employee = require('./Employee');
const Delivery = require('./Delivery');
const Customer = require('./Customer');

const db = {
  sequelize,
  User,
  WarehouseItem,
  Supplier,
  Setting,
  SalesItem,
  Sale,
  Price,
  Item,
  Expense,
  Employee,
  Delivery,
  Customer,
};

module.exports = db;