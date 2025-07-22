const express = require('express');
const router = express.Router();

// GET all payment details
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, payment_id, payment_method_id, account_id, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (payment_id) {
      whereClause.payment_id = payment_id;
    }
    if (payment_method_id) {
      whereClause.payment_method_id = payment_method_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (status) {
      whereClause.status = status;
    }

    const paymentDetails = await req.db.PaymentDetail.findAndCountAll({
      where: whereClause,
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
      }, {
        model: req.db.PaymentMethod,
        as: 'paymentMethod',
        attributes: ['description', 'short_description', 'type']
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
      order: [['payment_detail_id', 'DESC']]
    });

    res.json({
      data: paymentDetails.rows,
      pagination: {
        total: paymentDetails.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(paymentDetails.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single payment detail by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentDetail = await req.db.PaymentDetail.findByPk(id, {
      include: [{
        model: req.db.Payment,
        as: 'payment',
        include: [{
          model: req.db.Transaction,
          as: 'transaction',
          include: [{
            model: req.db.Merchant,
            as: 'merchant'
          }]
        }]
      }, {
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
    });
    
    if (!paymentDetail) {
      return res.status(404).json({ error: 'Payment detail not found' });
    }
    
    res.json(paymentDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new payment detail
router.post('/', async (req, res) => {
  try {
    const { 
      payment_id, 
      invoice_number, 
      amount_due, 
      payment_method_id, 
      balance, 
      status = 'Active', 
      remarks = '', 
      account_id 
    } = req.body;
    
    // Verify payment, payment method, and account exist
    const payment = await req.db.Payment.findByPk(payment_id);
    if (!payment) {
      return res.status(400).json({ error: 'Payment not found' });
    }
    
    const paymentMethod = await req.db.PaymentMethod.findByPk(payment_method_id);
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newPaymentDetail = await req.db.PaymentDetail.create({
      payment_id,
      invoice_number,
      amount_due,
      payment_method_id,
      balance,
      status,
      remarks,
      account_id
    });
    
    const paymentDetailWithDetails = await req.db.PaymentDetail.findByPk(newPaymentDetail.payment_detail_id, {
      include: [{
        model: req.db.Payment,
        as: 'payment'
      }, {
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
    });
    
    res.status(201).json(paymentDetailWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update payment detail by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoice_number, amount_due, balance, status, remarks } = req.body;
    
    const [updatedRowsCount] = await req.db.PaymentDetail.update({
      invoice_number,
      amount_due,
      balance,
      status,
      remarks
    }, {
      where: { payment_detail_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment detail not found or no changes made' });
    }
    
    const updatedPaymentDetail = await req.db.PaymentDetail.findByPk(id, {
      include: [{
        model: req.db.Payment,
        as: 'payment'
      }, {
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
    });
    
    res.json(updatedPaymentDetail);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE payment detail by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.PaymentDetail.destroy({
      where: { payment_detail_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Payment detail not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;