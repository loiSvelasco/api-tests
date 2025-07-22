const express = require('express');
const router = express.Router();

// GET all system settings
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause[req.db.sequelize.Op.or] = [
        { attribute: { [req.db.sequelize.Op.like]: `%${search}%` } },
        { value: { [req.db.sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const settings = await req.db.SysSetting.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sys_setting_id', 'DESC']]
    });

    res.json({
      data: settings.rows,
      pagination: {
        total: settings.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(settings.count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single setting by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const setting = await req.db.SysSetting.findByPk(id);
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET setting by attribute name
router.get('/attribute/:attribute', async (req, res) => {
  try {
    const { attribute } = req.params;
    const setting = await req.db.SysSetting.findOne({
      where: { attribute }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new setting
router.post('/', async (req, res) => {
  try {
    const { attribute, value } = req.body;
    
    // Check if attribute already exists
    const existingSetting = await req.db.SysSetting.findOne({ where: { attribute } });
    if (existingSetting) {
      return res.status(400).json({ error: 'Setting with this attribute already exists' });
    }
    
    const newSetting = await req.db.SysSetting.create({
      attribute,
      value
    });
    
    res.status(201).json(newSetting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update setting by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { attribute, value } = req.body;
    
    const [updatedRowsCount] = await req.db.SysSetting.update({
      attribute,
      value
    }, {
      where: { sys_setting_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Setting not found or no changes made' });
    }
    
    const updatedSetting = await req.db.SysSetting.findByPk(id);
    res.json(updatedSetting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update setting by attribute name
router.put('/attribute/:attribute', async (req, res) => {
  try {
    const { attribute } = req.params;
    const { value } = req.body;
    
    const [updatedRowsCount] = await req.db.SysSetting.update({
      value
    }, {
      where: { attribute }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Setting not found or no changes made' });
    }
    
    const updatedSetting = await req.db.SysSetting.findOne({ where: { attribute } });
    res.json(updatedSetting);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE setting by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRowsCount = await req.db.SysSetting.destroy({
      where: { sys_setting_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all unique attributes
router.get('/attributes/list', async (req, res) => {
  try {
    const attributes = await req.db.SysSetting.findAll({
      attributes: ['attribute'],
      group: ['attribute'],
      order: [['attribute', 'ASC']]
    });
    
    res.json(attributes.map(attr => attr.attribute));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;