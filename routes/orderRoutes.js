const express = require('express');
const router = express.Router();

// GET all orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, transaction_id, stock_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let merchantWhereClause = {};
    
    if (transaction_id) {
      whereClause.transaction_id = transaction_id;
    }
    if (stock_id) {
      whereClause.stock_id = stock_id;
    }
    if (search) {
      merchantWhereClause[req.db.sequelize.Op.or] = [
        { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { business_name: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const orders = await req.db.Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        include: [{
          model: req.db.Merchant,
          as: 'merchant',
          where: merchantWhereClause,
          attributes: ['firstname', 'lastname', 'business_name']
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
            as: 'item',
            attributes: ['description', 'short_description', 'unit']
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

// GET single order by ID
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
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new order
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

// PUT update order by ID
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
      return res.status(404).json({ error: 'Order not found or no changes made' });
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

// DELETE order by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.Order.destroy({
      where: { order_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;