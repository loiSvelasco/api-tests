const express = require('express');
const router = express.Router();

// GET all payment methods
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { description: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { short_description: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (type) {
      whereClause.type = { [req.db.sequelize.Op.like]: `%${type}%` };
    }

    const paymentMethods = await req.db.PaymentMethod.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.PaymentDetail,
        as: 'paymentDetails',
        attributes: ['payment_detail_id', 'amount_due', 'status'],
        required: false,
        limit: 3,
        order: [['payment_detail_id', 'DESC']]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['payment_method_id', 'DESC']]
    });

    res.json({
      data: paymentMethods.rows,
      pagination: {
        total: paymentMethods.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(paymentMethods.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single payment method by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentMethod = await req.db.PaymentMethod.findByPk(id, {
      include: [{
        model: req.db.PaymentDetail,
        as: 'paymentDetails',
        include: [{
          model: req.db.Payment,
          as: 'payment',
          include: [{
            model: req.db.Transaction,
            as: 'transaction',
            include: [{
              model: req.db.Merchant,
              as: 'merchant',
              attributes: ['firstname', 'lastname', 'business_name']
            }]
          }]
        }]
      }]
    });
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.json(paymentMethod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new payment method
router.post('/', async (req, res) => {
  try {
    const { description, short_description, type } = req.body;
    
    const newPaymentMethod = await req.db.PaymentMethod.create({
      description,
      short_description,
      type
    });
    
    res.status(201).json(newPaymentMethod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update payment method by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, short_description, type } = req.body;
    
    const [updatedRowsCount] = await req.db.PaymentMethod.update({
      description,
      short_description,
      type
    }, {
      where: { payment_method_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment method not found or no changes made' });
    }
    
    const updatedPaymentMethod = await req.db.PaymentMethod.findByPk(id);
    res.json(updatedPaymentMethod);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE payment method by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment method has payment details
    const paymentDetailCount = await req.db.PaymentDetail.count({ where: { payment_method_id: id } });
    if (paymentDetailCount > 0) {
      return res.status(400).json({ error: 'Cannot delete payment method with existing payment details' });
    }
    
    const deletedRowsCount = await req.db.PaymentMethod.destroy({
      where: { payment_method_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET payment method types
router.get('/types/list', async (req, res) => {
  try {
    const types = await req.db.PaymentMethod.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('type')), 'type'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('payment_method_id')), 'count']
      ],
      group: ['type'],
      order: [['type', 'ASC']],
      raw: true
    });
    
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;