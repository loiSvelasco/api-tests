const express = require('express');
const router = express.Router();

// GET all supplier returns
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, supplier_id, delivery_detail_id, account_id, active_status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (supplier_id) {
      whereClause.supplier_id = supplier_id;
    }
    if (delivery_detail_id) {
      whereClause.delivery_detail_id = delivery_detail_id;
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (active_status !== undefined) {
      whereClause.active_status = active_status === 'true';
    }

    const supplierReturns = await req.db.SupplierReturn.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Supplier,
        as: 'supplier',
        attributes: ['company_name', 'address', 'contact_details']
      }, {
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item',
          attributes: ['description', 'short_description']
        }, {
          model: req.db.Delivery,
          as: 'delivery',
          attributes: ['dr_number', 'date']
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
      order: [['supplier_return_id', 'DESC']]
    });

    res.json({
      data: supplierReturns.rows,
      pagination: {
        total: supplierReturns.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(supplierReturns.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single supplier return by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierReturn = await req.db.SupplierReturn.findByPk(id, {
      include: [{
        model: req.db.Supplier,
        as: 'supplier'
      }, {
        model: req.db.DeliveryDetail,
        as: 'deliveryDetail',
        include: [{
          model: req.db.Item,
          as: 'item'
        }, {
          model: req.db.Delivery,
          as: 'delivery'
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
    
    if (!supplierReturn) {
      return res.status(404).json({ error: 'Supplier return not found' });
    }
    
    res.json(supplierReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new supplier return
router.post('/', async (req, res) => {
  try {
    const { supplier_id, delivery_detail_id, number_of_box, quantity, active_status = false, account_id } = req.body;
    
    // Verify supplier, delivery detail, and account exist
    const supplier = await req.db.Supplier.findByPk(supplier_id);
    if (!supplier) {
      return res.status(400).json({ error: 'Supplier not found' });
    }
    
    const deliveryDetail = await req.db.DeliveryDetail.findByPk(delivery_detail_id);
    if (!deliveryDetail) {
      return res.status(400).json({ error: 'Delivery detail not found' });
    }
    
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newSupplierReturn = await req.db.SupplierReturn.create({
      supplier_id,
      delivery_detail_id,
      number_of_box,
      quantity,
      active_status,
      account_id
    });
    
    const supplierReturnWithDetails = await req.db.SupplierReturn.findByPk(newSupplierReturn.supplier_return_id, {
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
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(supplierReturnWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update supplier return by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number_of_box, quantity, active_status } = req.body;
    
    const [updatedRowsCount] = await req.db.SupplierReturn.update({
      number_of_box,
      quantity,
      active_status
    }, {
      where: { supplier_return_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Supplier return not found or no changes made' });
    }
    
    const updatedSupplierReturn = await req.db.SupplierReturn.findByPk(id, {
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
      }, {
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.json(updatedSupplierReturn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supplier return by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.SupplierReturn.destroy({
      where: { supplier_return_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Supplier return not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;