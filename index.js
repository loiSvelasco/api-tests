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
const userRoutes = require('./routes/userRoutes');
const warehouseItemRoutes = require('./routes/warehouseItemRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const settingRoutes = require('./routes/settingRoutes');
const salesItemRoutes = require('./routes/salesItemRoutes');
const saleRoutes = require('./routes/saleRoutes');
const priceRoutes = require('./routes/priceRoutes');
const itemRoutes = require('./routes/itemRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const customerRoutes = require('./routes/customerRoutes');

app.use(express.json());
app.use(cors());
app.use(dbMiddleware);

app.get('/health', checkDb, (req, res) => {
  res.send('Database is connected');
});


// routes
app.use('/accounts', accountRoutes);
app.use('/users', userRoutes);
app.use('/warehouse-items', warehouseItemRoutes); // http://localhost:3000/warehouse-items
app.use('/suppliers', supplierRoutes);
app.use('/settings', settingRoutes);
app.use('/sales-items', salesItemRoutes);
app.use('/sales', saleRoutes);
app.use('/prices', priceRoutes);
app.use('/items', itemRoutes);
app.use('/expenses', expenseRoutes);
app.use('/employees', employeeRoutes);
app.use('/deliveries', deliveryRoutes);
app.use('/customers', customerRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});