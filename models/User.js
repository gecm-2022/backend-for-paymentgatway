const mongoose = require('mongoose');
const Wallet = require('./Wallet'); // Assuming you have the wallet model in the same folder

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isadmin: {
    type: Boolean,
    default: false,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
});

// Pre-save hook to create a wallet for the user if it doesn't exist
userSchema.pre('save', async function (next) {
  // Only create a wallet if it doesn't exist
  if (!this.wallet) {
    try {
      const wallet = new Wallet({ userId: this._id, balance: 0 });
      await wallet.save();
      this.wallet = wallet._id;
    } catch (err) {
      return next(err); // Pass any error to the next middleware
    }
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
