const express = require('express');
const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { company_name: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { address: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { contact_details: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const suppliers = await req.db.Supplier.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Delivery,
        as: 'deliveries',
        attributes: ['delivery_id', 'dr_number', 'date', 'status'],
        required: false,
        limit: 5,
        order: [['date', 'DESC']]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['supplier_id', 'DESC']]
    });

    res.json({
      data: suppliers.rows,
      pagination: {
        total: suppliers.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(suppliers.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await req.db.Supplier.findByPk(id, {
      include: [{
        model: req.db.Delivery,
        as: 'deliveries',
        include: [{
          model: req.db.Account,
          as: 'account',
          attributes: ['username'],
          include: [{
            model: req.db.Employee,
            as: 'employee',
            attributes: ['firstname', 'lastname']
          }]
        }]
      }]
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new supplier
router.post('/', async (req, res) => {
  try {
    const { company_name, address, contact_details } = req.body;
    
    const newSupplier = await req.db.Supplier.create({
      company_name,
      address,
      contact_details
    });
    
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update supplier by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, address, contact_details } = req.body;
    
    const existingSupplier = await req.db.Supplier.findByPk(id);
    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const [updatedRowsCount] = await req.db.Supplier.update({
      company_name,
      address,
      contact_details
    }, {
      where: { supplier_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(400).json({ error: 'No changes were made' });
    }
    
    const updatedSupplier = await req.db.Supplier.findByPk(id);
    res.json(updatedSupplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE supplier by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingSupplier = await req.db.Supplier.findByPk(id);
    if (!existingSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier has deliveries
    const deliveryCount = await req.db.Delivery.count({ where: { supplier_id: id } });
    if (deliveryCount > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier with existing deliveries' });
    }
    
    const deletedRowsCount = await req.db.Supplier.destroy({
      where: { supplier_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(400).json({ error: 'Failed to delete supplier' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET supplier statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await req.db.Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const stats = await req.db.Delivery.findAll({
      where: { supplier_id: id },
      attributes: [
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('delivery_id')), 'total_deliveries'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('total_amount')), 'total_amount'],
        [req.db.sequelize.fn('AVG', req.db.sequelize.col('total_amount')), 'average_amount']
      ],
      raw: true
    });

    const statusBreakdown = await req.db.Delivery.findAll({
      where: { supplier_id: id },
      attributes: [
        'status',
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('delivery_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    res.json({
      supplier,
      statistics: stats[0],
      status_breakdown: statusBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;