const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const Member = require('../models/Member');
const Wallet = require('../models/wallet');
const Payments = require('../models/Payments');

// Create a new round
router.post('/', async (req, res) => {
  try {
    const members = await Member.find();
    const lastRound = await Round.findOne().sort({ roundNumber: -1 });
    const fixedAmount = req.body.fixed.fixedAmount || 400;
    
    // Create payments array with all members
    const payments = await Promise.all(members.map(async (member) => {
      // Find the member's last payment date from previous rounds
      let lastPaymentDate = new Date();
      
      if (lastRound) {
        const memberLastPayment = lastRound.payments.find(
          p => p.member === member.name
        );
        if (memberLastPayment && memberLastPayment.date) {
          lastPaymentDate = memberLastPayment.date;
        }
      }
      
      return {
        member: member.name,
        date: lastPaymentDate,
        amount: 0,
        leftToPay: fixedAmount,
        status: 'pending'
      };
    }));

    const round = new Round({
      roundNumber: req.body.roundNumber,
      date: new Date(), 
      payments: payments,
      isCompleted: false,
      fixedAmount: fixedAmount,
    });

    const newRound = await round.save();
    res.status(201).json(newRound);
  } catch (err) {
    console.error('Error creating round:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get all rounds
router.get('/', async (req, res) => {
  try {
    const rounds = await Round.find().populate('payments.member', 'name').sort({ date: -1 });;
    res.json(rounds);
  } catch (err) {
    console.error('Error fetching rounds:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get specific round
router.get('/:id', async (req, res) => {
  try {
    const round = await Round.findById(req.params.id).populate('payments.member', 'name');
    if (!round) return res.status(404).json({ message: 'Round not found' });
    res.json(round);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update payment status in a round
router.patch('/:roundId/payments/:paymentId', async (req, res) => {
  try {
    const round = await Round.findById(req.params.roundId);
    if (!round) return res.status(404).json({ message: 'Round not found' });

    const payment = round.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (req.body.amount !== undefined) payment.amount = req.body.amount;
    if (req.body.status !== undefined) payment.status = req.body.status;
    if (req.body.balance !== undefined) payment.balance = req.body.balance;

    await round.save();
    res.json(round);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Complete a round
router.patch('/:id/complete', async (req, res) => {
  try {
    const round = await Round.findByIdAndUpdate(
      req.params.id,
      { isCompleted: true },
      { new: true }
    );
    res.json(round);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:roundId/payments', async (req, res) => {
  try {
    const { amount, paidBy, date } = req.body;
    const round = await Round.findById(req.params.roundId);
    
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const wallet = await Wallet.findOne();
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Check if payment already exists for this member
    const existingPaymentIndex = round.payments.findIndex(
      p => p.member.toString() === paidBy
    );
    console.log("Payment Index", existingPaymentIndex);

    const newPayment = {
      member: paidBy,
      amount: amount,
      date: date || Date.now(),
      status: amount >= round.fixedAmount ? 'paid' : amount > 0 ? 'partial' : 'pending',
      leftToPay: Math.max(0, round.fixedAmount - amount)
    };

    const member = await Member.findOne({name: paidBy});

    let amountDifference = amount;
    let balanceDifference = 0;
    let flag = true;
    if (existingPaymentIndex >= 0) {
      flag = false;

      round.payments[existingPaymentIndex].amount += amount;
      
      if(round.payments[existingPaymentIndex].status == 'pending'){
        round.payments[existingPaymentIndex].date =  new Date(date || Date.now());
      }

      // Update status and leftToPay
      round.payments[existingPaymentIndex].status =
        round.payments[existingPaymentIndex].amount >= round.fixedAmount
          ? 'paid'
          : round.payments[existingPaymentIndex].amount > 0
          ? 'partial'
          : 'pending';

      round.payments[existingPaymentIndex].leftToPay = Math.max(
        0,
        round.fixedAmount - round.payments[existingPaymentIndex].amount
      );

      balanceDifference = round.payments[existingPaymentIndex].amount - round.fixedAmount;
      member.balance = balanceDifference;

      amountDifference = amount;
    } else {
      round.payments.push(newPayment);
      member.balance += amount-round.fixedAmount;
    }


    const paymentRecord = new Payments({
      member: paidBy,
      date: date || Date.now(),
      amount: amount,
      round: round.roundNumber || round._id
    });

    wallet.Balance += amount;
    round.Balance = round.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    
    const [savedWallet, savedRound, savedPayment, savedMember] = await Promise.all([
      wallet.save(),
      round.save(),
      paymentRecord.save(),
      member.save()
    ]);
    
    res.status(201).json({
      round: savedRound, 
      walletBalance: savedWallet.Balance,
      payment: savedPayment,
      member: savedMember,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:roundId/expenses', async (req, res) => {
  try {
    const { description, amount, balanceLeft, date } = req.body;
    const round = await Round.findById(req.params.roundId);
    
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const newExpense = {
      description,
      amount,
      balanceLeft,
      date: date || Date.now()
    };

    round.Expenses.push(newExpense);

    const wallet = await Wallet.findOne();
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    wallet.Balance -= amount;
    
    // Update round totals
    round.totalExpenses = round.Expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const updatedRound = await round.save();
    await wallet.save();
    res.status(201).json(updatedRound);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;