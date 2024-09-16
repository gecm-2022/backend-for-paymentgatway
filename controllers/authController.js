const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transactions = require('../models/Transaction'); // Make sure this model is correctly set up
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new user
const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ message: "Email id already exists!" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new user
    const usercreate = await User.create({ username, password: hashPassword });

    // Create wallet for the new user
    const newWallet = await Wallet.create({ userId: usercreate._id });

    // Update user with wallet reference
    usercreate.wallet = newWallet._id;
    await usercreate.save();

    // Create JWT token
    const data = {
      usercreate: {
        id: usercreate.id,
        admin: usercreate.isadmin
      }
    };
    const authtoken = await jwt.sign(data, process.env.jwt_key);

    return res.status(200).json({ message: "Registration successful", authtoken });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Login logic
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
   


    // Check if user exists
    const userExist = await User.findOne({ username });
    if (!userExist) {
      return res.status(400).json({ error: "Please try to login with correct credentials" });
    }

    // Compare password
    const comparePassword = await bcrypt.compare(password, userExist.password);
    if (!comparePassword) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Create JWT token
    const data = {
      usercreate: {
        id: userExist.id,
        admin: userExist.isadmin
      }
    };
    const usertype = userExist.isadmin ? "admin":"user";
    const authtoken = await jwt.sign(data, process.env.jwt_key);

    res.status(200).json({ message: "Login successful", authtoken, usertype });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get user info

const getuser = async (req, res) => {
  try {
    const userId = req.user.id;
    const usertype = req.user.admin ? "admin" : "user";

    // Fetch the user with populated wallet and transactions
    const user = await User.findById(userId)
      .populate({
        path: 'wallet',
        select: 'balance',
      })
      .populate({
        path: 'transactions',
        select: 'type amount orderId date',
        options: { sort: { date: -1 } }, // Sort transactions by date (descending)
      })
      .select('-password') // Exclude password
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total recharge amount and count for this user
    const totalRechargeData = await Transactions.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), type: 'recharge' }, // Filter by userId and recharge type
      },
      {
        $group: {
          _id: null, // No need to group by userId here, as you're querying for a specific user
          totalRechargeAmount: { $sum: "$amount" }, // Sum up recharge amounts
          totalRechargeCount: { $sum: 1 }, // Count the number of recharge transactions
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id
          totalRechargeAmount: 1, // Include total recharge amount
          totalRechargeCount: 1, // Include total recharge count
        },
      },
    ]);

    // Calculate total withdrawal amount and count for this user
    const totalWithdrawalData = await Transactions.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId), type: 'withdrawal' }, // Filter by userId and withdrawal type
      },
      {
        $group: {
          _id: null, // No need to group by userId here, as you're querying for a specific user
          totalWithdrawalAmount: { $sum: "$amount" }, // Sum up withdrawal amounts
          totalWithdrawalCount: { $sum: 1 }, // Count the number of withdrawal transactions
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id
          totalWithdrawalAmount: 1, // Include total withdrawal amount
          totalWithdrawalCount: 1, // Include total withdrawal count
        },
      },
    ]);

    // Return user details along with total recharge and withdrawal data
    return res.status(200).json({
      user,
      usertype,
      totalRechargeData: totalRechargeData.length > 0 ? totalRechargeData[0] : { totalRechargeAmount: 0, totalRechargeCount: 0 },
      totalWithdrawalData: totalWithdrawalData.length > 0 ? totalWithdrawalData[0] : { totalWithdrawalAmount: 0, totalWithdrawalCount: 0 },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password with the stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the password in the database
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




module.exports = { register, login, getuser ,changePassword};
