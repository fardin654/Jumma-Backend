const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payments');

// Get all Payments of a Member
router.get('/member/:memberId', async (req, res) => {
  try {
    const id = req.params.memberId;
    const payments = await Payment.find({ member: id, AccessCode: req.query.AccessCode })
      .sort({ date: -1 });
        
    res.json({payments});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}); 

// Get All Payments of a Round
router.get('/round/:roundNumber', async (req, res) => {
  try {
    const { roundNumber } = req.params;
    const payments = await Payment.find({ round: Number(roundNumber), AccessCode: req.query.AccessCode })
      .sort({ date: -1 });

    res.status(200).json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;