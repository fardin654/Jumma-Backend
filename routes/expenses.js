const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Round = require('../models/Round');

// Add new expense
router.post('/', async (req, res) => {
  const expense = new Expense({
    description: req.body.description,
    amount: req.body.amount,
    paidBy: req.body.paidBy,
    roundId: req.body.roundId
  });

  try {
    const newExpense = await expense.save();
    
    // Update round total expenses if roundId is provided
    if (req.body.roundId) {
      await Round.findByIdAndUpdate(req.body.roundId, {
        $inc: { totalExpenses: req.body.amount }
      });
    }
    
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().populate('paidBy', 'name');
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;