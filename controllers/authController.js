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
        const authtoken = await jwt.sign(data, process.env.jwt_key);

        res.status(200).json({ message: "Login successful", authtoken });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Get user info
const getuser = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch the user with populated wallet and transactions
        const user = await User.findById(userId)
            .populate({
                path: 'wallet',
                select: 'balance',
            })
            .populate({
                path: 'transactions',
                select: 'type amount orderId date',
                options: { sort: { date: -1 } }, // Sort by date in descending order
            })
            .select('-password') // Exclude password
            .exec();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

      
        // Calculate total recharge and withdrawal amounts
        const totalRechargeData = await Transactions.aggregate([
            {
              $match: { type: 'recharge' }, // Filter only recharge transactions
            },
            {
              $group: {
                _id: "$userId", // Group by userId, or any other field if needed
                totalRechargeAmount: { $sum: "$amount" }, // Sum the amounts for recharge
                totalRechargeCount: { $sum: 1 }, // Count the number of recharge transactions
              },
            },
            {
              $project: {
                _id: 1, // Include userId
                totalRechargeAmount: 1, // Include total recharge amount
                totalRechargeCount: 1, // Include the count of recharge transactions
              },
            },
          ]);
          
        //   console.log(totalRechargeData);
          
          const totalWithdrawalData = await Transactions.aggregate([
            {
              $match: { type: 'withdrawal' }, // Filter only withdrawal transactions
            },
            {
              $group: {
                _id: "$userId", // Group by userId, or any other field if needed
                totalWithdrawalAmount: { $sum: "$amount" }, // Sum the amounts for withdrawal
                totalWithdrawalCount: { $sum: 1 }, // Count the number of withdrawal transactions
              },
            },
            {
              $project: {
                _id: 1, // Include userId
                totalWithdrawalAmount: 1, // Include total withdrawal amount
                totalWithdrawalCount: 1, // Include the count of withdrawal transactions
              },
            },
          ]);
        //   console.log(totalWithdrawalData);
          

        return res.status(200).json({
            user,
            totalRechargeData,
            totalWithdrawalData,
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register, login, getuser };
