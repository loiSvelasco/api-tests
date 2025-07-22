const express = require('express');
const router = express.Router();

// GET all merchant return logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, merchant_return_id, account_id, status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (merchant_return_id) {
      whereClause.merchant_return_id = merchant_return_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (status) {
      whereClause.status = { [req.db.sequelize.Op.like]: `%${status}%` };
    }
    if (date_from && date_to) {
      whereClause.date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const merchantReturnLogs = await req.db.MerchantReturnLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.MerchantReturn,
        as: 'merchantReturn',
        include: [{
          model: req.db.Merchant,
          as: 'merchant',
          attributes: ['firstname', 'lastname', 'business_name']
        }, {
          model: req.db.Order,
          as: 'order',
          attributes: ['order_id', 'quantity', 'amount']
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
      order: [['date_time', 'DESC']]
    });

    res.json({
      data: merchantReturnLogs.rows,
      pagination: {
        total: merchantReturnLogs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(merchantReturnLogs.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single merchant return log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantReturnLog = await req.db.MerchantReturnLog.findByPk(id, {
      include: [{
        model: req.db.MerchantReturn,
        as: 'merchantReturn',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
        }, {
          model: req.db.Order,
          as: 'order'
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
    
    if (!merchantReturnLog) {
      return res.status(404).json({ error: 'Merchant return log not found' });
    }
    
    res.json(merchantReturnLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new merchant return log
router.post('/', async (req, res) => {
  try {
    const { merchant_return_id, status, account_id } = req.body;
    
    // Verify merchant return and account exist
    const merchantReturn = await req.db.MerchantReturn.findByPk(merchant_return_id);
    if (!merchantReturn) {
      return res.status(400).json({ error: 'Merchant return not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newMerchantReturnLog = await req.db.MerchantReturnLog.create({
      merchant_return_id,
      status,
      account_id
    });
    
    const merchantReturnLogWithDetails = await req.db.MerchantReturnLog.findByPk(newMerchantReturnLog.merchant_returns_logs_id, {
      include: [{
        model: req.db.MerchantReturn,
        as: 'merchantReturn',
        include: [{
          model: req.db.Merchant,
          as: 'merchant'
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
    
    res.status(201).json(merchantReturnLogWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE merchant return log by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.MerchantReturnLog.destroy({
      where: { merchant_returns_logs_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Merchant return log not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;