const User = require('../models/User');
const Wallet = require('../models/Wallet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new user
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // user exist check.........
        const userExist = await User.findOne({ username });
        if (userExist) {
            return res.status(400).json({ message: "Email id is already exist!!.." });
        }
        // hash password create....
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // new user creating.......
        const usercreate = await User.create({ username, password: hashPassword });

        // Create wallet for the new user
        const newWallet = await Wallet.create({ userId: usercreate._id });

        // Update user with wallet reference
        usercreate.wallet = newWallet._id;
        await usercreate.save();

        // jwt token creating
        const data = {
            usercreate: {
                id: usercreate.id,
                admin: usercreate.isadmin
            }
        }
        const authtoken = await jwt.sign(data, process.env.jwt_key);


        return res.status(200).json({ message: "Registation is successfull", authtoken })

    } catch (error) {
        return res.status(500).json({ message: "internal server error." });

    }
}
//logic of  login page 
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        // check user exist or not 
        const userExist = await User.findOne({ username });
        if (!userExist) {
            return res.status(400).json({ error: "Please try to login with correct credentials" })

        }
        // comparePassword...
        const comparePassword = await bcrypt.compare(password, userExist.password);
        if (!comparePassword) {
            return res.status(400).json({ error: "Please try to login with correct password.." })

        }
        // jwt token creating
        const data = {
            usercreate: {
                id: userExist.id,
                admin: userExist.isadmin
            }
        }
        const authtoken = await jwt.sign(data, process.env.jwt_key);


        res.status(200).json({ message: "Login is successfull...", authtoken: authtoken });




    } catch (error) {
        return res.status(500).json({ message: "internal server error." });

    }
}

// Get user info
const getuser = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch the user with populated wallet and transactions
        const user = await User.findById(userId)
            .populate({
                path: 'wallet',
                select: 'balance', // Select fields you want from wallet
            })
            .populate({
                path: 'transactions',
                select: 'type amount orderId date', // Select fields you want from transaction
                options: { sort: { date: -1 } } // Optional: sort transactions by date
            })
            .select('-password') // Exclude password
            .exec();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register, login, getuser }
