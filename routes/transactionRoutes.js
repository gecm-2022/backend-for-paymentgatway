const express = require('express');
const router = express.Router();
const { rechargeWallet, withdrawFromWallet, getUserTransactions, createTransaction, updateTransactionRefId, getAllTransactions, declineTransaction, confirmTransaction ,updateTransactionUpiId} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authmiddleware');
const adminmiddleware = require('../middleware/adminmiddleware');

// Apply authentication middleware to these routes
// router.post('/transactions/recharge', authMiddleware, rechargeWallet);
// router.post('/transactions/withdraw', authMiddleware, withdrawFromWallet);
router.get('/getUserTransactions', authMiddleware, getUserTransactions); // Use GET for fetching user's transactions
router.post('/createTransaction', authMiddleware, createTransaction); // Use POST for creating a new transaction
router.get('/getAllTransactions', authMiddleware, getAllTransactions); // Use POST for creating a new transaction
router.post('/updateTransactionRefId', authMiddleware, updateTransactionRefId);
router.put('/confirmTransaction/:transactionId', authMiddleware,adminmiddleware,  confirmTransaction);
router.put('/declineTransaction/:transactionId', authMiddleware, adminmiddleware, declineTransaction);

router.post('/updateTransactionUpiId', authMiddleware, updateTransactionUpiId);

module.exports = router;
