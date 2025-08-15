const mongoose = require('mongoose');

const PaymentsSchema = new mongoose.Schema({
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
  round: {
    type:Number,
    required: true
  }
});

module.exports = mongoose.model('Payments', PaymentsSchema);