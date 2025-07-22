const express = require('express');
const router = express.Router();

// Note: This appears to be an alias for accounts based on the context
// Redirecting to account operations

// GET all users (accounts)
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

// GET single user by ID
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
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    const { employee_id, username, password, is_active = true } = req.body;
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAccount = await req.db.Account.create({
      employee_id,
      username,
      password: hashedPassword,
      is_active
    });

    const accountResponse = await req.db.Account.findByPk(newAccount.account_id, {
      include: [{
        model: req.db.Employee,
        as: 'employee'
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json(accountResponse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update user by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, is_active } = req.body;
    
    let updateData = { username, is_active };
    
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const [updatedRowsCount] = await req.db.Account.update(updateData, {
      where: { account_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'User not found or no changes made' });
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
    res.status(400).json({ error: err.message });
  }
});

// DELETE user by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.Account.destroy({
      where: { account_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;