const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const sales = await req.db.Sale.findAll();
		res.json(sales);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newSale = await req.db.Sale.create(req.body);
		res.status(201).json(newSale);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;