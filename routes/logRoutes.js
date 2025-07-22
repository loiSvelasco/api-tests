const express = require('express');
const router = express.Router();

// GET all logs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, account_id, module, event, date_from, date_to } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (account_id) {
      whereClause.account_id = account_id;
    }
    if (module) {
      whereClause.module = { [req.db.sequelize.Op.like]: `%${module}%` };
    }
    if (event) {
      whereClause.event = { [req.db.sequelize.Op.like]: `%${event}%` };
    }
    if (date_from && date_to) {
      whereClause.date_time = {
        [req.db.sequelize.Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const logs = await req.db.Log.findAndCountAll({
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
      data: logs.rows,
      pagination: {
        total: logs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(logs.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const log = await req.db.Log.findByPk(id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new log
router.post('/', async (req, res) => {
  try {
    const { account_id, module, event } = req.body;
    
    // Verify account exists
    const account = await req.db.Account.findByPk(account_id);
    if (!account) {
      return res.status(400).json({ error: 'Account not found' });
    }
    
    const newLog = await req.db.Log.create({
      account_id,
      module,
      event
    });
    
    const logWithDetails = await req.db.Log.findByPk(newLog.log_id, {
      include: [{
        model: req.db.Account,
        as: 'account',
        include: [{
          model: req.db.Employee,
          as: 'employee'
        }]
      }]
    });
    
    res.status(201).json(logWithDetails);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE log by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.Log.destroy({
      where: { log_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET log modules
router.get('/modules/list', async (req, res) => {
  try {
    const modules = await req.db.Log.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('module')), 'module'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('log_id')), 'count']
      ],
      group: ['module'],
      order: [['module', 'ASC']],
      raw: true
    });
    
    res.json(modules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET log events
router.get('/events/list', async (req, res) => {
  try {
    const events = await req.db.Log.findAll({
      attributes: [
        [req.db.sequelize.fn('DISTINCT', req.db.sequelize.col('event')), 'event'],
        [req.db.sequelize.fn('COUNT', req.db.sequelize.col('log_id')), 'count']
      ],
      group: ['event'],
      order: [['event', 'ASC']],
      raw: true
    });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;