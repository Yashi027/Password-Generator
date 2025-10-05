const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const VaultItem = require('../models/VaultItem');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const items = await VaultItem.find({ user: req.userId });
    res.json(items);
  } catch(err) {
    console.error('Get Vault Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { encryptedData } = req.body;
  try {
    const item = new VaultItem({ user: req.userId, encryptedData });
    await item.save();
    res.json(item);
  } catch(err) {
    console.error('Add Vault Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { encryptedData } = req.body;
  try {
    const item = await VaultItem.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { encryptedData },
      { new: true }
    );
    res.json(item);
  } catch(err) {
    console.error('Update Vault Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await VaultItem.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ msg: 'Deleted' });
  } catch(err) {
    console.error('Delete Vault Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
