const express = require('express');
const router = express.Router();

// GET all items
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, unit } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { short_description: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (category) {
      whereClause.category = { [req.db.sequelize.Op.like]: `%${category}%` };
    }
    if (unit) {
      whereClause.unit = unit;
    }

    const items = await req.db.Item.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetails',
        attributes: ['delivery_detail_id', 'delivery_box', 'actual_weight'],
        required: false,
        limit: 3,
        order: [['delivery_detail_id', 'DESC']]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['item_id', 'DESC']]
    });

    res.json({
      data: items.rows,
      pagination: {
        total: items.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(items.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await req.db.Item.findByPk(id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetails',
        include: [{
          model: req.db.Delivery,
          as: 'delivery',
          attributes: ['dr_number', 'date', 'status'],
          include: [{
            model: req.db.Supplier,
            as: 'supplier',
            attributes: ['company_name']
          }]
        }]
      }]
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new item
router.post('/', async (req, res) => {
  try {
    const { 
      description, 
      short_description, 
      category, 
      unit = 'Kgs', 
      reorder_level_upper = 0, 
      reorder_level_lower = 0 
    } = req.body;
    
    const newItem = await req.db.Item.create({
      description,
      short_description,
      category,
      unit,
      reorder_level_upper,
      reorder_level_lower
    });
    
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update item by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      description, 
      short_description, 
      category, 
      unit, 
      reorder_level_upper, 
      reorder_level_lower 
    } = req.body;
    
    const existingItem = await req.db.Item.findByPk(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const [updatedRowsCount] = await req.db.Item.update({
      description,
      short_description,
      category,
      unit,
      reorder_level_upper,
      reorder_level_lower
    }, {
      where: { item_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(400).json({ error: 'No changes were made' });
    }
    
    const updatedItem = await req.db.Item.findByPk(id);
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingItem = await req.db.Item.findByPk(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item has delivery details
    const deliveryDetailCount = await req.db.DeliveryDetail.count({ where: { item_id: id } });
    if (deliveryDetailCount > 0) {
      return res.status(400).json({ error: 'Cannot delete item with existing delivery details' });
    }
    
    const deletedRowsCount = await req.db.Item.destroy({
      where: { item_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(400).json({ error: 'Failed to delete item' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET item categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await req.db.Item.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('category')), 'category'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('item_id')), 'count']
      ],
      group: ['category'],
      order: [['category', 'ASC']],
      raw: true
    });
    
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET items with low stock (below reorder level)
router.get('/low-stock/list', async (req, res) => {
  try {
    // This would require complex joins with stock tables
    // For now, return items that need attention based on reorder levels
    const lowStockItems = await req.db.Item.findAll({
      where: {
        reorder_level_lower: { [req.db.sequelize.Op.gt]: 0 }
      },
      order: [['reorder_level_lower', 'ASC']]
    });
    
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;