const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Payment = require('../models/Payments');
const Expense = require('../models/Expense');
const Request = require('../models/Requests');
const Round = require('../models/Round');
const Wallet = require('../models/wallet');

// Get all Requests of a Member
router.get('/:memberId', async (req, res) => {
  try {
    const id = req.params.memberId;
    const requests = await Request.find({ member: req.params.memberId})
      .sort({ date: -1 });
        
    res.json({requests});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}); 

// Get All Requests for an Admin
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find({ AccessCode: req.query.AccessCode })
      .sort({ date: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new Request
router.post('/', async (req, res) => {
    try{
        const { memberId, date, amount, roundId, paymentType, AccessCode } = req.body;
        const request = new Request({
            member: memberId,
            date,
            amount,
            roundId,
            paymentType,
            AccessCode,
            isApproved: "pending"
        });

        try {
            const newRequest = await request.save();
            res.status(201).json(newRequest);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve or Reject a Request
router.patch('/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { isApproved } = req.body;

        request.isApproved = isApproved;
        await request.save();

        if (isApproved === "true") {
            const member = await Member.findOne({_id: request.member});
            if (!member) {
                return res.status(404).json({ message: 'Member not found' });
            }
            const round = await Round.findById(request.roundId);    
            if (!round) {
                return res.status(404).json({ message: 'Round not found' });
            }
            const wallet = await Wallet.findOne({AccessCode: req.body.AccessCode});
            if (!wallet) {
                return res.status(404).json({ message: 'Wallet not found' });
            }

            // Check if payment already exists for this member
            const existingPaymentIndex = round.payments.findIndex( p => p.member.toString() === request.member.toString());

            const amount = request.amount;
            const newPayment = {
                member: request.member,
                amount: request.amount,
                date: request.date || Date.now(),
                status: request.amount >= round.fixedAmount ? 'paid' : request.amount > 0 ? 'partial' : 'pending',
                leftToPay: Math.max(0, round.fixedAmount - request.amount)
            };
        
            let balanceDifference = 0;
            if (existingPaymentIndex >= 0) {
        
                round.payments[existingPaymentIndex].amount += amount;
                
                if(round.payments[existingPaymentIndex].status == 'pending'){
                    round.payments[existingPaymentIndex].date =  new Date(request.date || Date.now());
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
            } else {
                round.payments.push(newPayment);
                member.balance += amount-round.fixedAmount;
            }
        
        
            const paymentRecord = new Payment({
                member: request.member,
                date: request.date || Date.now(),
                amount: amount,
                round: request.round || round.roundNumber,
                AccessCode: request.AccessCode
            });
        
            wallet.Balance += amount;
            round.Balance = round.payments.reduce((sum, payment) => sum + payment.amount, 0);
            
            
            const [savedWallet, savedRound, savedPayment, savedMember] = await Promise.all([
                wallet.save(),
                round.save(),
                paymentRecord.save(),
                member.save()
            ]);

            if(request.paymentType === 'expense'){
                try{
                    savedWallet.Balance -= request.amount;

                    const expense = new Expense({
                        description: `Paid by: ${member.name}`,
                        amount: request.amount,
                        balanceLeft: savedWallet.Balance,
                        date: request.date || Date.now(),
                        AccessCode: request.AccessCode
                    });
                    savedRound.Expenses.push(expense);

                    round.totalExpenses = round.Expenses.reduce((sum, expense) => sum + expense.amount, 0);

                    await savedRound.save();
                    await expense.save();
                    await savedWallet.save();
                    return res.status(201).json({
                        message: 'Payment approved',
                        requestId: request._id,
                        member: savedMember,
                        wallet: savedWallet,
                        round: savedRound,
                        payment: savedPayment
                    });
                } catch(err){
                    return res.status(500).json({message: 'Error creating expense:', err});
                }
            } else {
                return res.status(200).json({
                    message: 'Payment approved',
                    requestId: request._id,
                    member: savedMember,
                    wallet: savedWallet,
                    round: savedRound,
                    payment: savedPayment
                });
            }
        } else if (isApproved === "false") {
            return res.json({ message: 'Request rejected', deletedRequest });
        } else {
            return res.status(400).json({ message: 'Invalid isApproved value' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;