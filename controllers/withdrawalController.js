exports.withdraw = async (req, res) => {
    const { userId, amount } = req.body;
    
    try {
      const user = await User.findById(userId);
      
      if (user.wallet >= amount) {
        const transaction = new Transaction({
          userId,
          type: 'withdraw',
          amount,
          status: 'pending'
        });
        
        await transaction.save();
        
        user.wallet -= amount;
        await user.save();
        
        res.status(200).json({ success: true, transaction });
      } else {
        res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  