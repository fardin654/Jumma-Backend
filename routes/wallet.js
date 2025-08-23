const express = require('express');
const router = express.Router();
const Wallet = require('../models/wallet');

// Get Wallet Balance
router.get('/', async (req, res) => {
  try {
    const walletData = await Wallet.findOne();
    if (!walletData) {
      walletData = new Wallet({ Balance: 0 });
      await walletData.save();
    }
    res.json({ Balance: walletData.Balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;