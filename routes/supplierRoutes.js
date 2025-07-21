const express = require('express');
const router = express.Router();

// GET all supplier details
router.get('/', async (req, res) => {
	try {
		const suppliers = await req.db.Supplier.findAll();
		res.json(suppliers);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// POST create new supplier details
router.post('/', async (req, res) => {
	try {
		const newSupplier = await req.db.Supplier.create(req.body);
		res.status(201).json(newSupplier);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;