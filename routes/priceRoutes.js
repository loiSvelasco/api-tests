const express = require('express');
const router = express.Router();

// GET all price logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, stock_id, account_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (stock_id) {
      whereClause.stock_id = stock_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (date_from && date_to) {
      whereClause.post_date = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const priceLogs = await req.db.PriceLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Stock,
        as: 'stock',
        include: [{
          model: req.db.DeliveryDetail,
          as: 'deliveryDetail',
          include: [{
            model: req.db.Item,
            as: 'item',
            attributes: ['description', 'short_description', 'category']
          }, {
            model: req.db.Delivery,
            as: 'delivery',
            include: [{
              model: req.db.Supplier,
              as: 'supplier',
              attributes: ['company_name']
            }]
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
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['post_date', 'DESC']]
    });

    res.json({
      data: priceLogs.rows,
      pagination: {
        total: priceLogs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(priceLogs.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single price log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const priceLog = await req.db.PriceLog.findByPk(id, {
      include: [{
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
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    if (!priceLog) {
      return res.status(404).json({ error: 'Price log not found' });
    }
    
    res.json(priceLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new price log
router.post('/', async (req, res) => {
  try {
    const { stock_id, active_mark_up, active_selling_price, account_id } = req.body;
    
    // Verify stock and account exist
    const stock = await req.db.Stock.findByPk(stock_id);
    if (!stock) {
      return res.status(400).json({ error: 'Stock not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    // Update the stock with new prices
    await req.db.Stock.update({
      active_markup: active_mark_up,
      active_selling_price
    }, {
      where: { stock_id }
    });
    
    // Create price log entry
    const newPriceLog = await req.db.PriceLog.create({
      stock_id,
      active_mark_up,
      active_selling_price,
      account_id
    });
    
    const priceLogWithDetails = await req.db.PriceLog.findByPk(newPriceLog.price_log_id, {
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
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(priceLogWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET current prices for all stocks
router.get('/current/all', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    
    let itemWhereClause = {};
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
        model: req.db.StockOnHand,
        as: 'stockOnHand',
        attributes: ['quantity', 'number_of_box']
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

// GET price history for a specific stock
router.get('/history/:stock_id', async (req, res) => {
  try {
    const { stock_id } = req.params;
    const { limit = 10 } = req.query;
    
    const priceHistory = await req.db.PriceLog.findAll({
      where: { stock_id },
      include: [{
        model: req.db.Account,
        as: 'account',
        attributes: ['username'],
        include: [{
          model: req.db.Employee,
          as: 'employee',
          attributes: ['firstname', 'lastname']
        }]
      }],
      limit: parseInt(limit),
      order: [['post_date', 'DESC']]
    });
    
    res.json(priceHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT bulk update prices
router.put('/bulk-update', async (req, res) => {
  try {
    const { updates, account_id } = req.body; // updates is array of {stock_id, active_mark_up, active_selling_price}
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { stock_id, active_mark_up, active_selling_price } = update;
      
      // Update stock
      await req.db.Stock.update({
        active_markup: active_mark_up,
        active_selling_price
      }, {
        where: { stock_id }
      });
      
      // Create price log
      const priceLog = await req.db.PriceLog.create({
        stock_id,
        active_mark_up,
        active_selling_price,
        account_id
      });
      
      results.push(priceLog);
    }
    
    res.json({ message: 'Bulk price update completed', updated_count: results.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;