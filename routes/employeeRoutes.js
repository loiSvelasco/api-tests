const express = require('express');
const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, position } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { firstname: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { lastname: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (position) {
      whereClause.position = { [req.db.sequelize.Op.like]: `%${position}%` };
    }

    const employees = await req.db.Employee.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Account,
        as: 'account',
        attributes: ['account_id', 'username', 'is_active'],
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['employee_id', 'DESC']]
    });

    res.json({
      data: employees.rows,
      pagination: {
        total: employees.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(employees.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await req.db.Employee.findByPk(id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        attributes: ['account_id', 'username', 'is_active']
      }]
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new employee
router.post('/', async (req, res) => {
  try {
    const { firstname, lastname, position, permissions = {} } = req.body;
    
    const newEmployee = await req.db.Employee.create({
      firstname,
      lastname,
      position,
      permissions
    });
    
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update employee by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, position, permissions } = req.body;
    
    const existingEmployee = await req.db.Employee.findByPk(id);
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const [updatedRowsCount] = await req.db.Employee.update({
      firstname,
      lastname,
      position,
      permissions
    }, {
      where: { employee_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(400).json({ error: 'No changes were made' });
    }
    
    const updatedEmployee = await req.db.Employee.findByPk(id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        attributes: ['account_id', 'username', 'is_active']
      }]
    });
    
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE employee by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingEmployee = await req.db.Employee.findByPk(id);
    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has an associated account
    const account = await req.db.Account.findOne({ where: { employee_id: id } });
    if (account) {
      return res.status(400).json({ error: 'Cannot delete employee with associated account' });
    }
    
    const deletedRowsCount = await req.db.Employee.destroy({
      where: { employee_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(400).json({ error: 'Failed to delete employee' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET employees without accounts
router.get('/without-accounts/list', async (req, res) => {
  try {
    const employees = await req.db.Employee.findAll({
      include: [{
        model: req.db.Account,
        as: 'account',
        required: false
      }],
      where: {
        '$account.account_id$': null
      }
    });
    
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;