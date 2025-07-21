const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const deliveries = await req.db.Delivery.findAll();
		res.json(deliveries);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newDelivery = await req.db.Delivery.create(req.body);
		res.status(201).json(newDelivery);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;