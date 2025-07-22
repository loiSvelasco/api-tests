const express = require('express');
const router = express.Router();

// GET all customers (merchants)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, nature } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { business_name: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { address: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (nature) {
      whereClause.nature = { [req.db.sequelize.Op.like]: `%${nature}%` };
    }

    const merchants = await req.db.Merchant.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Transaction,
        as: 'transactions',
        attributes: ['transaction_id', 'transaction_date_time', 'amount_due', 'status'],
        required: false,
        limit: 5,
        order: [['transaction_date_time', 'DESC']]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['merchant_id', 'DESC']]
    });

    res.json({
      data: merchants.rows,
      pagination: {
        total: merchants.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(merchants.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchant = await req.db.Merchant.findByPk(id, {
      include: [{
        model: req.db.Transaction,
        as: 'transactions',
        include: [{
          model: req.db.Order,
          as: 'orders',
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
          model: req.db.Payment,
          as: 'payment',
          include: [{
            model: req.db.PaymentDetail,
            as: 'paymentDetails'
          }]
        }]
      }]
    });
    
    if (!merchant) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(merchant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new customer
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, address, business_name, nature } = req.body;
    
    const newMerchant = await req.db.Merchant.create({
      firstname,
      lastname,
      address,
      business_name,
      nature
    });
    
    res.status(201).json(newMerchant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update customer by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, address, business_name, nature } = req.body;
    
    const [updatedRowsCount] = await req.db.Merchant.update({
      firstname,
      lastname,
      address,
      business_name,
      nature
    }, {
      where: { merchant_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Customer not found or no changes made' });
    }
    
    const updatedMerchant = await req.db.Merchant.findByPk(id);
    res.json(updatedMerchant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE customer by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if merchant has transactions
    const transactionCount = await req.db.Transaction.count({ where: { merchant_id: id } });
    if (transactionCount > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with existing transactions' });
    }
    
    const deletedRowsCount = await req.db.Merchant.destroy({
      where: { merchant_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET customer statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const merchant = await req.db.Merchant.findByPk(id);
    if (!merchant) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const stats = await req.db.Transaction.findAll({
      where: { merchant_id: id },
      attributes: [
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('transaction_id')), 'total_transactions'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount_due')), 'total_amount'],
        [req.db.sequelize.fn('AVG', req.db.sequelize.col('amount_due')), 'average_amount'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('discount')), 'total_discount']
      ],
      raw: true
    });

    const statusBreakdown = await req.db.Transaction.findAll({
      where: { merchant_id: id },
      attributes: [
        'status',
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('transaction_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Get recent transactions
    const recentTransactions = await req.db.Transaction.findAll({
      where: { merchant_id: id },
      limit: 10,
      order: [['transaction_date_time', 'DESC']],
      attributes: ['transaction_id', 'transaction_date_time', 'amount_due', 'status']
    });

    res.json({
      customer: merchant,
      statistics: stats[0],
      status_breakdown: statusBreakdown,
      recent_transactions: recentTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET customer business nature list
router.get('/nature/list', async (req, res) => {
  try {
    const natures = await req.db.Merchant.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('nature')), 'nature'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('merchant_id')), 'count']
      ],
      group: ['nature'],
      order: [['nature', 'ASC']],
      raw: true
    });
    
    res.json(natures);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;