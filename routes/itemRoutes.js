const express = require('express');
const router = express.Router();

// GET all items
router.get('/', async (req, res) => {
  try {
    const items = await req.db.Item.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await req.db.Item.findByPk(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new item
router.post('/', async (req, res) => {
  try {
    const newItem = await req.db.Item.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update item by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the item exists
    const existingItem = await req.db.Item.findByPk(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Update the item
    const [updatedRowsCount] = await req.db.Item.update(req.body, {
      where: { item_id: id }
    });
    
    if (updatedRowsCount === 0) {
      return res.status(400).json({ error: 'No changes were made' });
    }
    
    // Fetch and return the updated item
    const updatedItem = await req.db.Item.findByPk(id);
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE item by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the item exists
    const existingItem = await req.db.Item.findByPk(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Delete the item
    const deletedRowsCount = await req.db.Item.destroy({
      where: { item_id: id }
    });
    
    if (deletedRowsCount === 0) {
      return res.status(400).json({ error: 'Failed to delete item' });
    }
    
    res.status(204).send(); // 204 No Content - successful deletion
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;