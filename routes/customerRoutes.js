const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const customers = await req.db.Customer.findAll();
		res.json(customers);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newCustomer = await req.db.Customer.create(req.body);
		res.status(201).json(newCustomer);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;