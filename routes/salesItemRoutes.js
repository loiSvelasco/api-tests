const express = require('express');
const router = express.Router();

// GET all sales items (orders with details)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, transaction_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let transactionWhereClause = {};
    
    if (transaction_id) {
      whereClause.transaction_id = transaction_id;
    }
    
    if (date_from && date_to) {
      transactionWhereClause.transaction_date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const orders = await req.db.Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        where: transactionWhereClause,
        include: [{
          model: req.db.Merchant,
          as: 'merchant',
          where: search ? {
            [req.db.sequelize.Op.or]: [
              { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
              { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } },
              { business_name: { [req.db.sequelize.Op.like]: `%${search}%` } }
            ]
          } : {}
        }, {
          model: req.db.Account,
          as: 'account',
          attributes: ['username'],
          include: [{
            model: req.db.Employee,
            as: 'employee',
            attributes: ['firstname', 'lastname']
          }]
        }]
      }, {
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
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['order_id', 'DESC']]
    });

    res.json({
      data: orders.rows,
      pagination: {
        total: orders.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(orders.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single sales item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await req.db.Order.findByPk(id, {
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
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
        }]
      }, {
        model: req.db.Stock,
        as: 'stock',
        include: [{
          model: req.db.DeliveryDetail,
          as: 'deliveryDetail',
          include: [{
            model: req.db.Item,
            as: 'item'
          }, {
            model: req.db.Delivery,
            as: 'delivery',
            include: [{
              model: req.db.Supplier,
              as: 'supplier'
            }]
          }]
        }]
      }]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Sales item not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new sales item
router.post('/', async (req, res) => {
  try {
    const { 
      transaction_id, 
      stock_id, 
      number_of_box, 
      quantity, 
      unit_cost, 
      amount, 
      discount = 0 
    } = req.body;
    
    // Verify transaction and stock exist
    const transaction = await req.db.Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found' });
    }
    
    const stock = await req.db.Stock.findByPk(stock_id);
    if (!stock) {
      return res.status(400).json({ error: 'Stock not found' });
    }
    
    const newOrder = await req.db.Order.create({
      transaction_id,
      stock_id,
      number_of_box,
      quantity,
      unit_cost,
      amount,
      discount
    });
    
    const orderWithDetails = await req.db.Order.findByPk(newOrder.order_id, {
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
        }]
      }, {
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
    });
    
    res.status(201).json(orderWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update sales item by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number_of_box, quantity, unit_cost, amount, discount } = req.body;
    
    const [updatedRowsCount] = await req.db.Order.update({
      number_of_box,
      quantity,
      unit_cost,
      amount,
      discount
    }, {
      where: { order_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Sales item not found or no changes made' });
    }
    
    const updatedOrder = await req.db.Order.findByPk(id, {
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
        }]
      }, {
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
    });
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE sales item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.Order.destroy({
      where: { order_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Sales item not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sales summary by date range
router.get('/summary/stats', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let dateFilter = {};
    if (date_from && date_to) {
      dateFilter.transaction_date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const salesSummary = await req.db.Order.findAll({
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        where: dateFilter,
        attributes: []
      }],
      attributes: [
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('order_id')), 'total_items'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('quantity')), 'total_quantity'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount')), 'total_amount'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('discount')), 'total_discount']
      ],
      raw: true
    });

    res.json(salesSummary[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;