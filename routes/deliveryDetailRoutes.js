const express = require('express');
const router = express.Router();

// GET all delivery details
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, delivery_id, item_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let itemWhereClause = {};
    
    if (delivery_id) {
      whereClause.delivery_id = delivery_id;
    }
    if (item_id) {
      whereClause.item_id = item_id;
    }
    if (search) {
      itemWhereClause[req.db.sequelize.Op.or] = [
        { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { short_description: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const deliveryDetails = await req.db.DeliveryDetail.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Delivery,
        as: 'delivery',
        include: [{
          model: req.db.Supplier,
          as: 'supplier',
          attributes: ['company_name']
        }]
      }, {
        model: req.db.Item,
        as: 'item',
        where: itemWhereClause
      }, {
        model: req.db.DeliveryItemDetail,
        as: 'deliveryItemDetails',
        required: false
      }, {
        model: req.db.Stock,
        as: 'stocks',
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['delivery_detail_id', 'DESC']]
    });

    res.json({
      data: deliveryDetails.rows,
      pagination: {
        total: deliveryDetails.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(deliveryDetails.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single delivery detail by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryDetail = await req.db.DeliveryDetail.findByPk(id, {
      include: [{
        model: req.db.Delivery,
        as: 'delivery',
        include: [{
          model: req.db.Supplier,
          as: 'supplier'
        }, {
          model: req.db.Account,
          as: 'account',
          include: [{
            model: req.db.Employee,
            as: 'employee'
          }]
        }]
      }, {
        model: req.db.Item,
        as: 'item'
      }, {
        model: req.db.DeliveryItemDetail,
        as: 'deliveryItemDetails'
      }, {
        model: req.db.Stock,
        as: 'stocks'
      }]
    });
    
    if (!deliveryDetail) {
      return res.status(404).json({ error: 'Delivery detail not found' });
    }
    
    res.json(deliveryDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new delivery detail
router.post('/', async (req, res) => {
  try {
    const { 
      delivery_id, 
      item_id, 
      delivery_box, 
      delivery_weight, 
      actual_box, 
      actual_weight, 
      capital 
    } = req.body;
    
    // Verify delivery and item exist
    const delivery = await req.db.Delivery.findByPk(delivery_id);
    if (!delivery) {
      return res.status(400).json({ error: 'Delivery not found' });
    }
    
    const item = await req.db.Item.findByPk(item_id);
    if (!item) {
      return res.status(400).json({ error: 'Item not found' });
    }
    
    const newDeliveryDetail = await req.db.DeliveryDetail.create({
      delivery_id,
      item_id,
      delivery_box,
      delivery_weight,
      actual_box,
      actual_weight,
      capital
    });
    
    const deliveryDetailWithDetails = await req.db.DeliveryDetail.findByPk(newDeliveryDetail.delivery_detail_id, {
      include: [{
        model: req.db.Delivery,
        as: 'delivery',
        include: [{
          model: req.db.Supplier,
          as: 'supplier'
        }]
      }, {
        model: req.db.Item,
        as: 'item'
      }]
    });
    
    res.status(201).json(deliveryDetailWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update delivery detail by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_box, delivery_weight, actual_box, actual_weight, capital } = req.body;
    
    const [updatedRowsCount] = await req.db.DeliveryDetail.update({
      delivery_box,
      delivery_weight,
      actual_box,
      actual_weight,
      capital
    }, {
      where: { delivery_detail_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Delivery detail not found or no changes made' });
    }
    
    const updatedDeliveryDetail = await req.db.DeliveryDetail.findByPk(id, {
      include: [{
        model: req.db.Delivery,
        as: 'delivery',
        include: [{
          model: req.db.Supplier,
          as: 'supplier'
        }]
      }, {
        model: req.db.Item,
        as: 'item'
      }]
    });
    
    res.json(updatedDeliveryDetail);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE delivery detail by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if delivery detail has stocks
    const stockCount = await req.db.Stock.count({ where: { delivery_detail_id: id } });
    if (stockCount > 0) {
      return res.status(400).json({ error: 'Cannot delete delivery detail with existing stocks' });
    }
    
    const deletedRowsCount = await req.db.DeliveryDetail.destroy({
      where: { delivery_detail_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Delivery detail not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;