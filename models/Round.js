const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  member: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  leftToPay: {
    type: Number,
    required: true,
    default: 400
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  }
});

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
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  }
});

const RoundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  payments: [PaymentSchema],
  Expenses: [ExpenseSchema],
  isCompleted: {
    type: Boolean,
    default: false
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  Balance: {
    type: Number,
    default: 0
  },
  fixedAmount: {
    type: Number,
    default: 400
  }
});

module.exports = mongoose.model('Round', RoundSchema);