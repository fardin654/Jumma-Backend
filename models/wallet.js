// wallet.js
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  Balance: {
    type: Number,
    required: true,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Wallet', WalletSchema);