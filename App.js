require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
// const bodyparser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use(cors());
app.use(express.json()); 
const connectdb = require('./databaseSetup');


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  connectdb();

  console.log(`Server running on port ${PORT}`);
});
