const express = require('express');
const router = express.Router();
const Round = require('../models/Round');
const Member = require('../models/Member');
const Wallet = require('../models/wallet');
const Payments = require('../models/Payments');
const Expense = require('../models/Expense');

// Create New Round
router.post('/', async (req, res) => {
  try {
    const { AccessCode, fixedAmount = 400, members: memberIds } = req.body;

    // Fetch only the members included in the request
    const members = await Member.find({ _id: { $in: memberIds }, AccessCode });

    const lastRound = await Round.findOne({ AccessCode }).sort({ roundNumber: -1 });
    const roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;

    // Create payments array only for selected members
    const payments = members.map((member) => {
      let lastPaymentDate = new Date();

      if (lastRound && lastRound.payments) {
        const memberLastPayment = lastRound.payments.find(
          (p) => p.member.toString() === member._id.toString()
        );
        if (memberLastPayment?.date) {
          lastPaymentDate = memberLastPayment.date;
        }
      }

      return {
        member: member._id,
        date: lastPaymentDate,
        amount: 0,
        leftToPay: fixedAmount,
        status: 'pending',
      };
    });

    const round = new Round({
      roundNumber,
      date: new Date(),
      payments,
      isCompleted: false,
      fixedAmount,
      AccessCode,
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
    const rounds = await Round.find({AccessCode: req.query.AccessCode}).populate('payments.member', 'name').sort({ date: -1 });;
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
      { isCompleted: true,
        endDate: new Date() },
      { new: true }
    );
    res.json(round);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a round
router.delete('/:id', async (req, res) => {
  try {
    const round = await Round.findByIdAndDelete(req.params.id);

    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    res.json({ message: 'Round deleted successfully', round });
  } catch (err) {
    console.error('Error deleting round:', err);
    res.status(500).json({ message: err.message });
  }
});


// Add New Payment
router.post('/:roundId/payments', async (req, res) => {
  try {
    const { amount, paidBy, date, paymentType } = req.body;
    const round = await Round.findById(req.params.roundId);
    
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const wallet = await Wallet.findOne({AccessCode: req.body.AccessCode});
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Check if payment already exists for this member
    const existingPaymentIndex = round.payments.findIndex(
      p => p.member === paidBy
    );

    const newPayment = {
      member: paidBy,
      amount: amount,
      date: date || Date.now(),
      status: amount >= round.fixedAmount ? 'paid' : amount > 0 ? 'partial' : 'pending',
      leftToPay: Math.max(0, round.fixedAmount - amount)
    };

    const member = await Member.findOne({_id: paidBy});
    if(!member){
      return res.status(404).json({message: 'Member not found'});
    }

    let balanceDifference = 0;
    if (existingPaymentIndex >= 0) {

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
      round: round.roundNumber || round._id,
      AccessCode: req.body.AccessCode
    });

    round.Balance = round.payments.reduce((sum, payment) => sum + payment.amount, 0);

    if(paymentType == 'expense'){
      const expense = {
          description: `Paid by: ${member.name}`,
          amount: amount,
          balanceLeft: wallet.Balance,
          date: date || Date.now(),
          AccessCode: req.body.AccessCode
      };

      round.Expenses.push(expense);
      round.totalExpenses = round.Expenses.reduce((sum, expense) => sum + expense.amount, 0);
    } else if(paymentType == 'wallet'){
      wallet.Balance += amount;
    }
    
    
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

// Add Expense
router.post('/:roundId/expenses', async (req, res) => {
  try {
    const { description, amount, balanceLeft, date, AccessCode } = req.body;
    const round = await Round.findById(req.params.roundId);
    
    if (!round) {
      return res.status(404).json({ message: 'Round not found' });
    }

    const newExpense = {
      description,
      amount,
      balanceLeft,
      date: date || Date.now(),
      AccessCode
    };

    round.Expenses.push(newExpense);

    const wallet = await Wallet.findOne({AccessCode: AccessCode});
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