const mongoose = require('mongoose');

const ContactsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    type: String,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  AccessCode: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contacts', ContactsSchema);