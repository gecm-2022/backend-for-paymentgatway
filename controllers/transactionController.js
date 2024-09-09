const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const mongoose = require('mongoose')
// Fetch user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from authenticated user (from authMiddleware)

    // Fetch all transactions for the authenticated user
    const transactions = await Transaction.find({ userId });

    if (!transactions.length) {
      return res.status(404).json({ success: false, message: 'No transactions found for this user' });
    }

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    // const userId = req.user.id; // Extract user ID from authenticated user
    // const type = 'recharge';
    const { userId, amount, type } = req.body;

    // Validate that type is either 'recharge' or 'withdrawal'
    if (!['recharge', 'withdrawal'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    // Create a transaction for the authenticated user
    const newTransaction = new Transaction({
      userId,
      type,
      amount,
      status: 'pending', // Transaction starts as pending
    });

    await newTransaction.save();
    res.status(201).json({ success: true, transaction: { _id: newTransaction._id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating transaction' });
  }
};


// Update transaction with refId (entered by user)
exports.updateTransactionRefId = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from authenticated user
    const { transactionId, refId } = req.body;
    // console.log("Transaction ID:", transactionId, "User ID:", userId);


    // Find the transaction by its ID and ensure it belongs to the authenticated user
    const transaction = await Transaction.findOne({ _id: transactionId, userId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or does not belong to this user' });
    }

    // Update the refId and save the transaction
    transaction.refId = refId;
    await transaction.save();

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating transaction' });
  }
};

// Admin route to get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { type, status } = req.query;

    // Create filter object
    const filter = {};

    if (type === "recharge") {
      filter.refId = { $exists: true, $ne: "" }; // Only include transactions with refId for recharge
    } else if (type === "withdrawal") {
      filter.upiId = { $exists: true, $ne: "" }; // Only include transactions with upiId for withdrawal
    }

    if (status) {
      filter.status = status;
    }
    const transactions = await Transaction.find(filter)
      .populate({
        path: 'userId', // Assuming `userId` is the reference field in your Transaction model
        select: 'username' // Select only the `userName` field from the User model
      })
      .exec();
    // Fetch transactions based on filter
    // const transactions = await Transaction.find(filter);

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Error fetching transactions' });
  }
};




// Confirm a transaction
exports.confirmTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find the transaction by ID
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction already completed' });
    }

    // Find the user associated with the transaction and populate their wallet
    const user = await User.findById(transaction.userId).populate('wallet');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wallet) {
      // Create a wallet for the user if it doesn't exist (in case it was missed earlier)
      const newWallet = new Wallet({ userId: user._id, balance: 0 });
      await newWallet.save();
      user.wallet = newWallet._id;
      await user.save();
    }

    // console.log('Current Wallet Balance:', user.wallet.balance);
    // console.log('Transaction Amount:', transaction.amount);

    if (transaction.type === 'recharge') {
      // For recharges, add the transaction amount to the user's wallet balance
      user.wallet.balance += transaction.amount;
    } else if (transaction.type === 'withdrawal') {
      // For withdrawals, check if the user has enough balance to withdraw
      if (user.wallet.balance < transaction.amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance for withdrawal' });
      }
      // Deduct the transaction amount from the user's wallet balance
      user.wallet.balance -= transaction.amount;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    // console.log('Updated Wallet Balance:', user.wallet.balance);

    // Save the updated wallet
    await user.wallet.save();

    // Mark the transaction as completed
    transaction.status = 'completed';
    await transaction.save();

    res.status(200).json({ success: true, message: 'Transaction confirmed and wallet updated', transaction });
  } catch (error) {
    console.error('Error confirming transaction:', error);
    res.status(500).json({ success: false, message: 'Error confirming transaction' });
  }
};





// Decline a transaction
exports.declineTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.status = 'failed';
    await transaction.save();

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error('Error declining transaction:', error);
    res.status(500).json({ success: false, message: 'Error declining transaction' });
  }
};

exports.updateTransactionUpiId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId, upiId } = req.body;

    // Find the transaction by its ID and ensure it belongs to the authenticated user
    const transaction = await Transaction.findOne({ _id: transactionId, userId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or does not belong to this user' });
    }

    // Update the UPI ID and save the transaction
    transaction.upiId = upiId;
    await transaction.save();

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    console.error("Error updating UPI ID:", error);
    res.status(500).json({ success: false, message: 'Error updating UPI ID' });
  }
};






