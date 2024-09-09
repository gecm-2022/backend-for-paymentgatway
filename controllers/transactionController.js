const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
    const userId = req.user.id; // Extract user ID from authenticated user
    const type = 'recharge';
    const { amount } = req.body;

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
    const filter = {
      refId: { $exists: true, $ne: "" }
    };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    // Fetch transactions based on filter
    const transactions = await Transaction.find(filter);

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
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.status = 'completed';
    await transaction.save();

    res.status(200).json({ success: true, transaction });
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





