const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const middleware = require('../middleware/authmiddleware');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/getuser',middleware, authController.getuser);
router.post('/changePassword',middleware, authController.changePassword);

module.exports = router;
