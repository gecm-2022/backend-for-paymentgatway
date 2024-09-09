const express = require('express');
const router = express.Router();
const { rechargeWallet, withdrawFromWallet, getUserTransactions, createTransaction, updateTransactionRefId, getAllTransactions, declineTransaction, confirmTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authmiddleware');

// Apply authentication middleware to these routes
// router.post('/transactions/recharge', authMiddleware, rechargeWallet);
// router.post('/transactions/withdraw', authMiddleware, withdrawFromWallet);
router.get('/getUserTransactions', authMiddleware, getUserTransactions); // Use GET for fetching user's transactions
router.post('/createTransaction', authMiddleware, createTransaction); // Use POST for creating a new transaction
router.get('/getAllTransactions', authMiddleware, getAllTransactions); // Use POST for creating a new transaction
router.post('/updateTransactionRefId', authMiddleware, updateTransactionRefId);
router.put('/confirmTransaction/:transactionId', authMiddleware, confirmTransaction);
router.put('/declineTransaction/:transactionId', authMiddleware, declineTransaction);


module.exports = router;
