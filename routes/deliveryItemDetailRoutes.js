const express = require('express');
const router = express.Router();

// GET all delivery item details
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, delivery_detail_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (delivery_detail_id) {
      whereClause.delivery_detail_id = delivery_detail_id;
    }
    if (search) {
      whereClause.box_code = { [req.db.sequelize.Op.like]: `%${search}%` };
    }

    const deliveryItemDetails = await req.db.DeliveryItemDetail.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
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
          attributes: ['description', 'short_description']
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['delivery_item_detail_id', 'DESC']]
    });

    res.json({
      data: deliveryItemDetails.rows,
      pagination: {
        total: deliveryItemDetails.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(deliveryItemDetails.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single delivery item detail by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryItemDetail = await req.db.DeliveryItemDetail.findByPk(id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
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
      }]
    });
    
    if (!deliveryItemDetail) {
      return res.status(404).json({ error: 'Delivery item detail not found' });
    }
    
    res.json(deliveryItemDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new delivery item detail
router.post('/', async (req, res) => {
  try {
    const { delivery_detail_id, box_code, delivery_weight, actual_weight, undefined } = req.body;
    
    // Verify delivery detail exists
    const deliveryDetail = await req.db.DeliveryDetail.findByPk(delivery_detail_id);
    if (!deliveryDetail) {
      return res.status(400).json({ error: 'Delivery detail not found' });
    }
    
    const newDeliveryItemDetail = await req.db.DeliveryItemDetail.create({
      delivery_detail_id,
      box_code,
      delivery_weight,
      actual_weight,
      undefined
    });
    
    const deliveryItemDetailWithDetails = await req.db.DeliveryItemDetail.findByPk(newDeliveryItemDetail.delivery_item_detail_id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item'
        }]
      }]
    });
    
    res.status(201).json(deliveryItemDetailWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update delivery item detail by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { box_code, delivery_weight, actual_weight, undefined } = req.body;
    
    const [updatedRowsCount] = await req.db.DeliveryItemDetail.update({
      box_code,
      delivery_weight,
      actual_weight,
      undefined
    }, {
      where: { delivery_item_detail_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Delivery item detail not found or no changes made' });
    }
    
    const updatedDeliveryItemDetail = await req.db.DeliveryItemDetail.findByPk(id, {
      include: [{
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item'
        }]
      }]
    });
    
    res.json(updatedDeliveryItemDetail);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE delivery item detail by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.DeliveryItemDetail.destroy({
      where: { delivery_item_detail_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Delivery item detail not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;