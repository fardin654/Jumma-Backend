const mongoose = require('mongoose');

const PaymentsSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
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
  },
  AccessCode: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Payments', PaymentsSchema);