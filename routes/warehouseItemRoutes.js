const express = require('express');
const router = express.Router();

// GET all warehouse items (stock on hand with details)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, low_stock } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
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
    if (low_stock === 'true') {
      whereClause.quantity = { [req.db.sequelize.Op.lt]: 10 }; // Assuming low stock is less than 10
    }

    const stockOnHand = await req.db.StockOnHand.findAndCountAll({
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
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['stock_on_hand_id', 'DESC']]
    });

    res.json({
      data: stockOnHand.rows,
      pagination: {
        total: stockOnHand.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(stockOnHand.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single warehouse item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stockOnHand = await req.db.StockOnHand.findByPk(id, {
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
        }, {
          model: req.db.PriceLog,
          as: 'priceLogs',
          limit: 5,
          order: [['post_date', 'DESC']]
        }]
      }]
    });
    
    if (!stockOnHand) {
      return res.status(404).json({ error: 'Warehouse item not found' });
    }
    
    res.json(stockOnHand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update warehouse item quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number_of_box, quantity } = req.body;
    
    const [updatedRowsCount] = await req.db.StockOnHand.update({
      number_of_box,
      quantity
    }, {
      where: { stock_on_hand_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Warehouse item not found or no changes made' });
    }
    
    const updatedStockOnHand = await req.db.StockOnHand.findByPk(id, {
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
    });
    
    res.json(updatedStockOnHand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET warehouse summary
router.get('/summary/stats', async (req, res) => {
  try {
    const totalItems = await req.db.StockOnHand.count();
    
    const lowStockItems = await req.db.StockOnHand.count({
      where: { quantity: { [req.db.sequelize.Op.lt]: 10 } }
    });
    
    const totalQuantity = await req.db.StockOnHand.sum('quantity');
    
    const categoryStats = await req.db.StockOnHand.findAll({
      include: [{
        model: req.db.Stock,
        as: 'stock',
        include: [{
          model: req.db.DeliveryDetail,
          as: 'deliveryDetail',
          include: [{
            model: req.db.Item,
            as: 'item',
            attributes: ['category']
          }]
        }]
      }],
      attributes: [
        [req.db.sequelize.col('stock.deliveryDetail.item.category'), 'category'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('stock_on_hand_id')), 'count'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('quantity')), 'total_quantity']
      ],
      group: ['stock.deliveryDetail.item.category'],
      raw: true
    });

    res.json({
      total_items: totalItems,
      low_stock_items: lowStockItems,
      total_quantity: totalQuantity || 0,
      category_breakdown: categoryStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;