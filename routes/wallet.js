const express = require('express');
const router = express.Router();
const Wallet = require('../models/wallet');

// Get Wallet Balance
router.get('/', async (req, res) => {
  try {
    const walletData = await Wallet.findOne();
    if (!walletData) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.json({ Balance: walletData.Balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;