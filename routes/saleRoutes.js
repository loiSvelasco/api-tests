const express = require('express');
const router = express.Router();

// GET all sales (transactions)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, date_from, date_to, merchant_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let merchantWhereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    if (merchant_id) {
      whereClause.merchant_id = merchant_id;
    }
    if (date_from && date_to) {
      whereClause.transaction_date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }
    if (search) {
      merchantWhereClause[req.db.sequelize.Op.or] = [
        { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { business_name: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const transactions = await req.db.Transaction.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Merchant,
        as: 'merchant',
        where: merchantWhereClause
      }, {
        model: req.db.Account,
        as: 'account',
        attributes: ['username'],
        include: [{
          model: req.db.Employee,
          as: 'employee',
          attributes: ['firstname', 'lastname']
        }]
      }, {
        model: req.db.Order,
        as: 'orders',
        include: [{
          model: req.db.Stock,
          as: 'stock',
          include: [{
            model: req.db.DeliveryDetail,
            as: 'deliveryDetail',
            include: [{
              model: req.db.Item,
              as: 'item',
              attributes: ['description', 'short_description']
            }]
          }]
        }]
      }, {
        model: req.db.Payment,
        as: 'payment',
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['transaction_id', 'DESC']]
    });

    res.json({
      data: transactions.rows,
      pagination: {
        total: transactions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(transactions.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single sale by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await req.db.Transaction.findByPk(id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }, {
        model: req.db.Order,
        as: 'orders',
        include: [{
          model: req.db.Stock,
          as: 'stock',
          include: [{
            model: req.db.DeliveryDetail,
            as: 'deliveryDetail',
            include: [{
              model: req.db.Item,
              as: 'item'
            }]
          }]
        }]
      }, {
        model: req.db.Payment,
        as: 'payment',
        include: [{
          model: req.db.PaymentDetail,
          as: 'paymentDetails',
          include: [{
            model: req.db.PaymentMethod,
            as: 'paymentMethod'
          }]
        }]
      }]
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new sale
router.post('/', async (req, res) => {
  try {
    const { 
      merchant_id, 
      amount_due, 
      discount = 0, 
      status = 'Draft', 
      account_id,
      orders = [] 
    } = req.body;
    
    // Verify merchant and account exist
    const merchant = await req.db.Merchant.findByPk(merchant_id);
    if (!merchant) {
      return res.status(400).json({ error: 'Merchant not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    // Create transaction
    const newTransaction = await req.db.Transaction.create({
      merchant_id,
      amount_due,
      discount,
      status,
      account_id
    });
    
    // Create orders if provided
    if (orders.length > 0) {
      const orderPromises = orders.map(order => 
        req.db.Order.create({
          ...order,
          transaction_id: newTransaction.transaction_id
        })
      );
      await Promise.all(orderPromises);
    }
    
    const transactionWithDetails = await req.db.Transaction.findByPk(newTransaction.transaction_id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }, {
        model: req.db.Order,
        as: 'orders'
      }]
    });
    
    res.status(201).json(transactionWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update sale by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_due, discount, status } = req.body;
    
    const [updatedRowsCount] = await req.db.Transaction.update({
      amount_due,
      discount,
      status
    }, {
      where: { transaction_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Sale not found or no changes made' });
    }
    
    const updatedTransaction = await req.db.Transaction.findByPk(id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }, {
        model: req.db.Order,
        as: 'orders'
      }]
    });
    
    res.json(updatedTransaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE sale by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if transaction has orders
    const orderCount = await req.db.Order.count({ where: { transaction_id: id } });
    if (orderCount > 0) {
      return res.status(400).json({ error: 'Cannot delete sale with existing orders' });
    }
    
    const deletedRowsCount = await req.db.Transaction.destroy({
      where: { transaction_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sales statistics
router.get('/statistics/summary', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let whereClause = {};
    if (date_from && date_to) {
      whereClause.transaction_date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const stats = await req.db.Transaction.findAll({
      where: whereClause,
      attributes: [
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('transaction_id')), 'total_sales'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount_due')), 'total_amount'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('discount')), 'total_discount'],
        [req.db.sequelize.fn('AVG', req.db.sequelize.col('amount_due')), 'average_sale']
      ],
      raw: true
    });

    const statusBreakdown = await req.db.Transaction.findAll({
      where: whereClause,
      attributes: [
        'status',
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('transaction_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      statistics: stats[0],
      status_breakdown: statusBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;