const axios = require('axios');

// Base URL for the bank API
const BASE_URL = 'https://api.examplebank.com'; // Replace with actual base URL

// Bank API credentials from environment variables
const API_KEY = process.env.BANK_API_KEY;
const API_SECRET = process.env.BANK_API_SECRET;

// Create an Axios instance with base URL and headers
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Function to process a recharge
const processRecharge = async (userId, amount) => {
  try {
    const response = await apiClient.post('/recharge', {
      userId,
      amount,
    });
    return response.data; // Assuming the API returns data in this format
  } catch (error) {
    console.error('Error processing recharge:', error.response?.data || error.message);
    throw new Error('Failed to process recharge');
  }
};

// Function to process a withdrawal
const processWithdrawal = async (userId, amount) => {
  try {
    const response = await apiClient.post('/withdraw', {
      userId,
      amount,
    });
    return response.data; // Assuming the API returns data in this format
  } catch (error) {
    console.error('Error processing withdrawal:', error.response?.data || error.message);
    throw new Error('Failed to process withdrawal');
  }
};

// Export functions
module.exports = {
  processRecharge,
  processWithdrawal,
};
