const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const prices = await req.db.Price.findAll();
		res.json(prices);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newPrice = await req.db.Price.create(req.body);
		res.status(201).json(newPrice);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;