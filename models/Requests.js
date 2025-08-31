const mongoose = require('mongoose');

const RequestsSchema = new mongoose.Schema({
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
  roundId: {
    type:mongoose.Schema.Types.ObjectId,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['wallet', 'expense'],
  },
  AccessCode: {
    type: String,
    required: true
  },
  isApproved: {
    type: String,
    enum: ["pending", "true", "false"],
    required: true
  }
});

module.exports = mongoose.model('Requests', RequestsSchema);