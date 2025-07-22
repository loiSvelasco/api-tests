const express = require('express');
const router = express.Router();

// GET all payments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, transaction_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    let merchantWhereClause = {};
    
    if (transaction_id) {
      whereClause.transaction_id = transaction_id;
    }
    if (search) {
      merchantWhereClause[req.db.sequelize.Op.or] = [
        { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { business_name: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const payments = await req.db.Payment.findAndCountAll({
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
        model: req.db.PaymentDetail,
        as: 'paymentDetails',
        include: [{
          model: req.db.PaymentMethod,
          as: 'paymentMethod',
          attributes: ['description', 'short_description', 'type']
        }]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['payment_id', 'DESC']]
    });

    res.json({
      data: payments.rows,
      pagination: {
        total: payments.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(payments.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single payment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await req.db.Payment.findByPk(id, {
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
        model: req.db.PaymentDetail,
        as: 'paymentDetails',
        include: [{
          model: req.db.PaymentMethod,
          as: 'paymentMethod'
        }, {
          model: req.db.Account,
          as: 'account',
          include: [{
            model: req.db.Employee,
            as: 'employee'
          }]
        }]
      }]
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new payment
router.post('/', async (req, res) => {
  try {
    const { transaction_id, total_payments, available_balance } = req.body;
    
    // Verify transaction exists
    const transaction = await req.db.Transaction.findByPk(transaction_id);
    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found' });
    }
    
    const newPayment = await req.db.Payment.create({
      transaction_id,
      total_payments,
      available_balance
    });
    
    const paymentWithDetails = await req.db.Payment.findByPk(newPayment.payment_id, {
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
        }]
      }]
    });
    
    res.status(201).json(paymentWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update payment by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total_payments, available_balance } = req.body;
    
    const [updatedRowsCount] = await req.db.Payment.update({
      total_payments,
      available_balance
    }, {
      where: { payment_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment not found or no changes made' });
    }
    
    const updatedPayment = await req.db.Payment.findByPk(id, {
      include: [{
        model: req.db.Transaction,
        as: 'transaction',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
        }]
      }, {
        model: req.db.PaymentDetail,
        as: 'paymentDetails'
      }]
    });
    
    res.json(updatedPayment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE payment by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment has payment details
    const paymentDetailCount = await req.db.PaymentDetail.count({ where: { payment_id: id } });
    if (paymentDetailCount > 0) {
      return res.status(400).json({ error: 'Cannot delete payment with existing payment details' });
    }
    
    const deletedRowsCount = await req.db.Payment.destroy({
      where: { payment_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;