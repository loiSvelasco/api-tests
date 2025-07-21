const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const expenses = await req.db.Expense.findAll();
		res.json(expenses);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newExpense = await req.db.Expense.create(req.body);
		res.status(201).json(newExpense);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;