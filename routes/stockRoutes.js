const express = require('express');
const router = express.Router();

// GET all stocks
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, delivery_detail_id, account_id, search, category } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let itemWhereClause = {};
    
    if (delivery_detail_id) {
      whereClause.delivery_detail_id = delivery_detail_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (search) {
      itemWhereClause[req.db.sequelize.Op.or] = [
        { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { short_description: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (category) {
      itemWhereClause.category = { [req.db.sequelize.Op.like]: `%${category}%` };
    }

    const stocks = await req.db.Stock.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item',
          where: itemWhereClause
        }, {
          model: req.db.Delivery,
          as: 'delivery',
          include: [{
            model: req.db.Supplier,
            as: 'supplier',
            attributes: ['company_name']
          }]
        }]
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
        model: req.db.StockOnHand,
        as: 'stockOnHand',
        attributes: ['quantity', 'number_of_box']
      }, {
        model: req.db.Order,
        as: 'orders',
        attributes: ['order_id', 'quantity', 'amount'],
        required: false,
        limit: 3
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['stock_id', 'DESC']]
    });

    res.json({
      data: stocks.rows,
      pagination: {
        total: stocks.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(stocks.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single stock by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await req.db.Stock.findByPk(id, {
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
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }, {
        model: req.db.StockOnHand,
        as: 'stockOnHand'
      }, {
        model: req.db.Order,
        as: 'orders'
      }, {
        model: req.db.PriceLog,
        as: 'priceLogs',
        limit: 5,
        order: [['post_date', 'DESC']]
      }]
    });
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new stock
router.post('/', async (req, res) => {
  try {
    const { delivery_detail_id, active_markup, active_selling_price, account_id } = req.body;
    
    // Verify delivery detail and account exist
    const deliveryDetail = await req.db.DeliveryDetail.findByPk(delivery_detail_id);
    if (!deliveryDetail) {
      return res.status(400).json({ error: 'Delivery detail not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newStock = await req.db.Stock.create({
      delivery_detail_id,
      active_markup,
      active_selling_price,
      account_id
    });
    
    const stockWithDetails = await req.db.Stock.findByPk(newStock.stock_id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item'
        }]
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(stockWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update stock by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active_markup, active_selling_price } = req.body;
    
    const [updatedRowsCount] = await req.db.Stock.update({
      active_markup,
      active_selling_price
    }, {
      where: { stock_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Stock not found or no changes made' });
    }
    
    const updatedStock = await req.db.Stock.findByPk(id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item'
        }]
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.json(updatedStock);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE stock by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if stock has orders
    const orderCount = await req.db.Order.count({ where: { stock_id: id } });
    if (orderCount > 0) {
      return res.status(400).json({ error: 'Cannot delete stock with existing orders' });
    }
    
    const deletedRowsCount = await req.db.Stock.destroy({
      where: { stock_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;