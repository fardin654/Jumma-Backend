const express = require('express');
const router = express.Router();
const Contacts = require('../models/Contacts');

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const members = await Contacts.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new member
router.post('/', async (req, res) => {
  const member = new Contacts({
    name: req.body.name,
    contact: req.body.contact || '0',
    description: req.body.description || ''
  });

  try {
    const newMember = await member.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update member
router.patch('/:id', async (req, res) => {
  try {
    const member = await Contacts.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (req.body.name !== undefined) member.name = req.body.name;
    if (req.body.contact !== undefined) member.contact = req.body.contact;
    if (req.body.description !== undefined) member.description = req.body.description;
    const updatedMember = await member.save();
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;