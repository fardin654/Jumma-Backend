const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payments');

// Get all members
router.get('/', async (req, res) => {
  try {
    const members = await Member.find({AccessCode: req.query.AccessCode});
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific member
router.get('/:id', async (req, res) => {
  try {
    const members = await Member.find({_id: req.params.id});
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new member
router.post('/', async (req, res) => {
  const member = new Member({
    name: req.body.name,
    balance: req.body.balance || 0,
    AccessCode: req.body.AccessCode
  });

  try {
    const newMember = await member.save();
    console.log(newMember);
    res.status(201).json(newMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update member (balance or next to pay status)
router.patch('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (req.body.balance !== undefined) member.balance = req.body.balance;
    if (req.body.isNextToPay !== undefined) member.isNextToPay = req.body.isNextToPay;

    const updatedMember = await member.save();
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;