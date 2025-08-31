const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  balanceLeft: {
    type: Number,
    default: 0
  },
  AccessCode: {
    type: String,
    required: true
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema);