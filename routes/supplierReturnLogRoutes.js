const express = require('express');
const router = express.Router();

// GET all supplier return logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, supplier_return_id, account_id, status, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (supplier_return_id) {
      whereClause.supplier_return_id = supplier_return_id;
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

    const supplierReturnLogs = await req.db.SupplierReturnLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.SupplierReturn,
        as: 'supplierReturn',
        include: [{
          model: req.db.Supplier,
          as: 'supplier',
          attributes: ['company_name']
        }, {
          model: req.db.DeliveryDetail,
          as: 'deliveryDetail',
          include: [{
            model: req.db.Item,
            as: 'item',
            attributes: ['description', 'short_description']
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
      order: [['date_time', 'DESC']]
    });

    res.json({
      data: supplierReturnLogs.rows,
      pagination: {
        total: supplierReturnLogs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(supplierReturnLogs.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single supplier return log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierReturnLog = await req.db.SupplierReturnLog.findByPk(id, {
      include: [{
        model: req.db.SupplierReturn,
        as: 'supplierReturn',
        include: [{
          model: req.db.Supplier,
          as: 'supplier'
        }, {
          model: req.db.DeliveryDetail,
          as: 'deliveryDetail',
          include: [{
            model: req.db.Item,
            as: 'item'
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
    
    if (!supplierReturnLog) {
      return res.status(404).json({ error: 'Supplier return log not found' });
    }
    
    res.json(supplierReturnLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new supplier return log
router.post('/', async (req, res) => {
  try {
    const { supplier_return_id, status, account_id } = req.body;
    
    // Verify supplier return and account exist
    const supplierReturn = await req.db.SupplierReturn.findByPk(supplier_return_id);
    if (!supplierReturn) {
      return res.status(400).json({ error: 'Supplier return not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newSupplierReturnLog = await req.db.SupplierReturnLog.create({
      supplier_return_id,
      status,
      account_id
    });
    
    const supplierReturnLogWithDetails = await req.db.SupplierReturnLog.findByPk(newSupplierReturnLog.supplier_returns_logs_id, {
      include: [{
        model: req.db.SupplierReturn,
        as: 'supplierReturn',
        include: [{
          model: req.db.Supplier,
          as: 'supplier'
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
    
    res.status(201).json(supplierReturnLogWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supplier return log by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.SupplierReturnLog.destroy({
      where: { supplier_returns_logs_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Supplier return log not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;