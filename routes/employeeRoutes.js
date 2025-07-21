const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const employees = await req.db.Employee.findAll();
		res.json(employees);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newEmployee = await req.db.Employee.create(req.body);
		res.status(201).json(newEmployee);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;