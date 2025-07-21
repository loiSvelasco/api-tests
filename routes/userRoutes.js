const express = require('express');
const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  console.log('users initiated')
  const users = await req.db.User.findAll();
  res.json(users);
});

// POST create a new user
router.post('/', async (req, res) => {
  try {
    const user = await req.db.User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;