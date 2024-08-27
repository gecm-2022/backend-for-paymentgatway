const express = require('express');
const router = express.Router();
const { rechargeWallet, withdrawFromWallet,getUserTransactions } = require('../controllers/transactionController');
const authmiddleware = require('../middleware/authmiddleware'); // Import authentication middleware

// Apply authentication middleware to these routes
router.post('/recharge', authmiddleware, rechargeWallet);
router.post('/withdraw', authmiddleware, withdrawFromWallet);
router.get('/getUserTransactions', authmiddleware, getUserTransactions);

module.exports = router;
