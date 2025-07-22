const express = require('express');
const router = express.Router();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, account_id, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { payee: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { particulars: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    if (type) {
      whereClause.type = { [req.db.sequelize.Op.like]: `%${type}%` };
    }
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (date_from && date_to) {
      whereClause.date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const expenses = await req.db.Expense.findAndCountAll({
      where: whereClause,
      include: [{
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
      data: expenses.rows,
      pagination: {
        total: expenses.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(expenses.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single expense by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await req.db.Expense.findByPk(id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new expense
router.post('/', async (req, res) => {
  try {
    const { payee, particulars, type, amount, account_id } = req.body;
    
    // Verify account exists
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newExpense = await req.db.Expense.create({
      payee,
      particulars,
      type,
      amount,
      account_id
    });
    
    const expenseWithDetails = await req.db.Expense.findByPk(newExpense.expense_id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(expenseWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update expense by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { payee, particulars, type, amount } = req.body;
    
    const [updatedRowsCount] = await req.db.Expense.update({
      payee,
      particulars,
      type,
      amount
    }, {
      where: { expense_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Expense not found or no changes made' });
    }
    
    const updatedExpense = await req.db.Expense.findByPk(id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE expense by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.Expense.destroy({
      where: { expense_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET expense types
router.get('/types/list', async (req, res) => {
  try {
    const types = await req.db.Expense.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('type')), 'type'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('expense_id')), 'count']
      ],
      group: ['type'],
      order: [['type', 'ASC']],
      raw: true
    });
    
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET expense summary by type
router.get('/summary/by-type', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let whereClause = {};
    if (date_from && date_to) {
      whereClause.date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const summary = await req.db.Expense.findAll({
      where: whereClause,
      attributes: [
        'type',
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('expense_id')), 'count'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount')), 'total_amount'],
        [req.db.sequelize.fn('AVG', req.db.sequelize.col('amount')), 'average_amount']
      ],
      group: ['type'],
      order: [[req.db.sequelize.fn('SUM', req.db.sequelize.col('amount')), 'DESC']],
      raw: true
    });
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET expense summary by date range
router.get('/summary/stats', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let whereClause = {};
    if (date_from && date_to) {
      whereClause.date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const stats = await req.db.Expense.findAll({
      where: whereClause,
      attributes: [
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('expense_id')), 'total_expenses'],
        [req.db.sequelize.fn('SUM', req.db.sequelize.col('amount')), 'total_amount'],
        [req.db.sequelize.fn('AVG', req.db.sequelize.col('amount')), 'average_amount'],
        [req.db.sequelize.fn('MIN', req.db.sequelize.col('amount')), 'min_amount'],
        [req.db.sequelize.fn('MAX', req.db.sequelize.col('amount')), 'max_amount']
      ],
      raw: true
    });

    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;