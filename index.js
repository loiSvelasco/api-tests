const express = require('express');
const cors = require('cors');
// not needed siguron? Matic agload ni .env / .env.development from database.js
// upon application start. Ba? Not sure hahaha pero working juray nu awan detoyen
// require('dotenv').config();

const app = express();
const dbMiddleware = require('./middleware/db');
const checkDb = require('./middleware/checkDbConnection');
const { sequelize } = require('./models');

//routes
const accountRoutes = require('./routes/accountRoutes');
const customerRoutes = require('./routes/customerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const deliveryDetailRoutes = require('./routes/deliveryDetailRoutes');
const deliveryItemDetailRoutes = require('./routes/deliveryItemDetailRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const itemRoutes = require('./routes/itemRoutes');
const logRoutes = require('./routes/logRoutes');
const merchantReturnRoutes = require('./routes/merchantReturnRoutes');
const merchantReturnLogRoutes = require('./routes/merchantReturnLogRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentDetailRoutes = require('./routes/paymentDetailRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const priceRoutes = require('./routes/priceRoutes');
const saleRoutes = require('./routes/saleRoutes');
const salesItemRoutes = require('./routes/salesItemRoutes');
const settingRoutes = require('./routes/settingRoutes');
const stockRoutes = require('./routes/stockRoutes');
const stockOnHandRoutes = require('./routes/stockOnHandRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const supplierReturnRoutes = require('./routes/supplierReturnRoutes');
const supplierReturnLogRoutes = require('./routes/supplierReturnLogRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(express.json());
app.use(cors());
app.use(dbMiddleware);

app.get('/health', checkDb, (req, res) => {
  res.send('Database is connected');
});


// routes
app.use('/accounts', accountRoutes);
app.use('/customers', customerRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/delivery-details', deliveryDetailRoutes);
app.use('/delivery-item-details', deliveryItemDetailRoutes);
app.use('/employees', employeeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/items', itemRoutes);
app.use('/logs', logRoutes);
app.use('/merchant-returns', merchantReturnRoutes);
app.use('/merchant-return-logs', merchantReturnLogRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/payment-details', paymentDetailRoutes);
app.use('/payment-methods', paymentMethodRoutes);
app.use('/prices', priceRoutes);
app.use('/sales', saleRoutes);
app.use('/sales-items', salesItemRoutes);
app.use('/settings', settingRoutes);
app.use('/stocks', stockRoutes);
app.use('/stock-on-hand', stockOnHandRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/supplier-returns', supplierReturnRoutes);
app.use('/supplier-return-logs', supplierReturnLogRoutes);
app.use('/transactions', transactionRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});