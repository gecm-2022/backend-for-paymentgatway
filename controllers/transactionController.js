const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { initiatePaytmPayment, verifyPaytmPayment } = require('../utils/paytmApi');

// Fetch user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch transactions for the user
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Recharge wallet
exports.rechargeWallet = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Create a new order ID
    const orderId = `ORDER_${new Date().getTime()}`;

    // Initiate Paytm payment
    const paytmResponse = await initiatePaytmPayment(orderId, amount, userId);

    if (paytmResponse.success) {
      res.status(200).json({
        success: true,
        paytmUrl: paytmResponse.paytmUrl,
        paytmParams: paytmResponse.paytmParams,
      });
    } else {
      res.status(400).json({ success: false, error: paytmResponse.error });
    }
  } catch (error) {
    console.error('Recharge error:', error.message);
    res.status(500).json({ success: false, error: 'Recharge error' });
  }
};

// Verification and updating the wallet balance after Paytm callback
exports.verifyAndCreditWallet = async (req, res) => {
  try {
    const verificationResponse = await verifyPaytmPayment(req.body);

    if (verificationResponse.success) {
      const { orderId, userId, amount } = verificationResponse;

      // Find or create the wallet for the user
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0 });
      }

      // Update wallet balance
      const updatedWallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { new: true }
      );

      // Log the transaction
      const transaction = await new Transaction({
        userId,
        type: 'recharge',
        amount,
        orderId,
      }).save();

      // Update user's transaction list
      await User.findByIdAndUpdate(userId, { $push: { transactions: transaction._id } });

      res.status(200).json({ success: true, wallet: updatedWallet });
    } else {
      res.status(400).json({ success: false, error: verificationResponse.error });
    }
  } catch (error) {
    console.error('Verification error:', error.message);
    res.status(500).json({ success: false, error: 'Verification error' });
  }
};

// Withdraw from wallet
exports.withdrawFromWallet = async (req, res) => {
  const { userId, amount } = req.body;

  try {
    // Find the wallet for the user
    const wallet = await Wallet.findOne({ userId });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Create a new order ID
    const orderId = `ORDER_${new Date().getTime()}`;

    // Initiate Paytm payment
    const paytmResponse = await initiatePaytmPayment(orderId, -amount, userId);

    if (paytmResponse.success) {
      const verificationResponse = await verifyPaytmPayment(paytmResponse);

      if (verificationResponse.success) {
        // Update wallet balance
        const updatedWallet = await Wallet.findOneAndUpdate(
          { userId },
          { $inc: { balance: -amount } },
          { new: true }
        );

        // Log the transaction
        const transaction = await new Transaction({
          userId,
          type: 'withdrawal',
          amount,
          orderId,
        }).save();

        // Update user's transaction list
        await User.findByIdAndUpdate(userId, { $push: { transactions: transaction._id } });

        res.status(200).json({ success: true, wallet: updatedWallet });
      } else {
        res.status(400).json({ success: false, error: verificationResponse.error });
      }
    } else {
      res.status(400).json({ success: false, error: paytmResponse.error });
    }
  } catch (error) {
    console.error('Withdrawal error:', error.message);
    res.status(500).json({ success: false, error: 'Withdrawal error' });
  }
};
