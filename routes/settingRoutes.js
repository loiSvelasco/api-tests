const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const settings = await req.db.Setting.findAll();
		res.json(settings);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const newSetting = await req.db.Setting.create(req.body);
		res.status(201).json(newSetting);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

module.exports = router;