const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const salesItems = await req.db.SalesItem.findAll();
		res.json(salesItems);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newSalesItem = await req.db.SalesItem.create(req.body);
		res.status(201).json(newSalesItem);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;