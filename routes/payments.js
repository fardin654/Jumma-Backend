const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payments');

router.get('/member/:memberName', async (req, res) => {
  try {
    const name = req.params.memberName;
    const payments = await Payment.find({ member: req.params.memberName })
      .sort({ date: -1 });
        
    res.json({payments});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}); 

router.get('/round/:roundNumber', async (req, res) => {
  try {
    const { roundNumber } = req.params;
    const payments = await Payment.find({ round: Number(roundNumber) })
      .sort({ date: -1 });

    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;