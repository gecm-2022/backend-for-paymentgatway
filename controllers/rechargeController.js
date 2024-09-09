const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.recharge = async (req, res) => {
  const { userId, amount } = req.body;
  
  try {
    const transaction = new Transaction({
      userId,
      type: 'recharge',
      amount,
      status: 'pending'
    });

    await transaction.save();

    // Send to payment page logic here

    res.status(200).json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.confirmRecharge = async (req, res) => {
  const { transactionId, token } = req.body;

  try {
    const transaction = await Transaction.findById(transactionId);

    if (transaction && transaction.token === token) {
      transaction.status = 'success';
      await transaction.save();

      const user = await User.findById(transaction.userId);
      user.wallet += transaction.amount;
      await user.save();

      res.status(200).json({ success: true, message: 'Recharge confirmed' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid token' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
