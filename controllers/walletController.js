const Wallet = require('../models/Wallet');

exports.confirmRecharge = async (req, res) => {
  const { transactionId, token } = req.body;

  try {
    const transaction = await Transaction.findById(transactionId);

    if (transaction && transaction.token === token) {
      transaction.status = 'success';
      await transaction.save();

      const wallet = await Wallet.findOne({ userId: transaction.userId });
      wallet.balance += transaction.amount;
      wallet.updatedAt = Date.now();
      await wallet.save();

      res.status(200).json({ success: true, message: 'Recharge confirmed' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid token' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
