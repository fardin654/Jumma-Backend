const express = require('express');
const router = express.Router();
const Wallet = require('../models/wallet');

// Get Wallet Balance
router.get('/', async (req, res) => {
  try {
    let walletData = await Wallet.findOne({AccessCode: req.query.AccessCode});
    if (!walletData) {
      walletData = new Wallet({ Balance: 0, AccessCode: req.query.AccessCode });
      await walletData.save();
    }
    res.json({ Balance: walletData.Balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Wallet
router.post('/', async (req,res) => {
  try{
    walletData = new Wallet({ Balance: 0, AccessCode: req.body.AccessCode });
    await walletData.save();
    res.json("Wallet Created.");
  }catch{
    res.status(500).json({message: err.message});
  }
});


module.exports = router;