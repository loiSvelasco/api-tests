const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause.username = { [req.db.sequelize.Op.like]: `%${search}%` };
    }
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const accounts = await req.db.Account.findAndCountAll({
      where: whereClause,
      include: [{
        model: req.db.Employee,
        as: 'employee',
        attributes: ['firstname', 'lastname', 'position']
      }],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['account_id', 'DESC']]
    });

    res.json({
      data: accounts.rows,
      pagination: {
        total: accounts.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(accounts.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single account by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await req.db.Account.findByPk(id, {
      include: [{
        model: req.db.Employee,
        as: 'employee'
      }],
      attributes: { exclude: ['password'] }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new account
router.post('/', async (req, res) => {
  try {
    const { employee_id, username, password, is_active = true } = req.body;
    
    // Check if employee exists
    const employee = await req.db.Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(400).json({ error: 'Employee not found' });
    }

    // Check if account already exists for this employee
    const existingAccount = await req.db.Account.findOne({ where: { employee_id } });
    if (existingAccount) {
      return res.status(400).json({ error: 'Account already exists for this employee' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAccount = await req.db.Account.create({
      employee_id,
      username,
      password: hashedPassword,
      is_active
    });

    // Return account without password
    const accountResponse = await req.db.Account.findByPk(newAccount.account_id, {
      include: [{
        model: req.db.Employee,
        as: 'employee'
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json(accountResponse);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// PUT update account by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, is_active } = req.body;
    
    const existingAccount = await req.db.Account.findByPk(id);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    let updateData = { username, is_active };
    
    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const [updatedRowsCount] = await req.db.Account.update(updateData, {
      where: { account_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(400).json({ error: 'No changes were made' });
    }
    
    const updatedAccount = await req.db.Account.findByPk(id, {
      include: [{
        model: req.db.Employee,
        as: 'employee'
      }],
      attributes: { exclude: ['password'] }
    });
    
    res.json(updatedAccount);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// DELETE account by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingAccount = await req.db.Account.findByPk(id);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const deletedRowsCount = await req.db.Account.destroy({
      where: { account_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(400).json({ error: 'Failed to delete account' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const account = await req.db.Account.findOne({
      where: { username, is_active: true },
      include: [{
        model: req.db.Employee,
        as: 'employee'
      }]
    });
    
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, account.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return account without password
    const { password: _, ...accountData } = account.toJSON();
    res.json({ message: 'Login successful', account: accountData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;