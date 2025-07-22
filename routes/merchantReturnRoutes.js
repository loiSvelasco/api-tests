const express = require('express');
const router = express.Router();

// GET all merchant returns
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, merchant_id, order_id, account_id, active_status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (merchant_id) {
      whereClause.merchant_id = merchant_id;
    }
    if (order_id) {
      whereClause.order_id = order_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (active_status !== undefined) {
      whereClause.active_status = active_status === 'true';
    }

    const merchantReturns = await req.db.MerchantReturn.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Merchant,
        as: 'merchant',
        attributes: ['firstname', 'lastname', 'business_name']
      }, {
        model: req.db.Order,
        as: 'order',
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
      order: [['merchant_return_id', 'DESC']]
    });

    res.json({
      data: merchantReturns.rows,
      pagination: {
        total: merchantReturns.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(merchantReturns.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single merchant return by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantReturn = await req.db.MerchantReturn.findByPk(id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Order,
        as: 'order',
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
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    if (!merchantReturn) {
      return res.status(404).json({ error: 'Merchant return not found' });
    }
    
    res.json(merchantReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new merchant return
router.post('/', async (req, res) => {
  try {
    const { merchant_id, order_id, number_of_box, quantity, active_status = false, account_id } = req.body;
    
    // Verify merchant, order, and account exist
    const merchant = await req.db.Merchant.findByPk(merchant_id);
    if (!merchant) {
      return res.status(400).json({ error: 'Merchant not found' });
    }
    
    const order = await req.db.Order.findByPk(order_id);
    if (!order) {
      return res.status(400).json({ error: 'Order not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newMerchantReturn = await req.db.MerchantReturn.create({
      merchant_id,
      order_id,
      number_of_box,
      quantity,
      active_status,
      account_id
    });
    
    const merchantReturnWithDetails = await req.db.MerchantReturn.findByPk(newMerchantReturn.merchant_return_id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Order,
        as: 'order'
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(merchantReturnWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update merchant return by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number_of_box, quantity, active_status } = req.body;
    
    const [updatedRowsCount] = await req.db.MerchantReturn.update({
      number_of_box,
      quantity,
      active_status
    }, {
      where: { merchant_return_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Merchant return not found or no changes made' });
    }
    
    const updatedMerchantReturn = await req.db.MerchantReturn.findByPk(id, {
      include: [{
        model: req.db.Merchant,
        as: 'merchant'
      }, {
        model: req.db.Order,
        as: 'order'
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.json(updatedMerchantReturn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE merchant return by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.MerchantReturn.destroy({
      where: { merchant_return_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Merchant return not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;