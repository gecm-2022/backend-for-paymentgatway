const axios = require('axios');
const PaytmChecksum = require('paytmchecksum');

// Paytm API credentials from environment variables
const PAYTM_MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE;
const PAYTM_CHANNEL_ID = process.env.PAYTM_CHANNEL_ID;
const PAYTM_INDUSTRY_TYPE_ID = process.env.PAYTM_INDUSTRY_TYPE_ID;
const PAYTM_CALLBACK_URL = process.env.PAYTM_CALLBACK_URL;

// Base URL for the Paytm API
const PAYTM_BASE_URL = 'https://securegw.paytm.in'; // Use 'https://securegw-stage.paytm.in' for staging

// Create an Axios instance for Paytm
const paytmClient = axios.create({
  baseURL: PAYTM_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to initiate a Paytm payment
const initiatePaytmPayment = async (orderId, amount, customerId) => {
  const paytmParams = {
    MID: PAYTM_MERCHANT_ID,
    WEBSITE: PAYTM_WEBSITE,
    INDUSTRY_TYPE_ID: PAYTM_INDUSTRY_TYPE_ID,
    CHANNEL_ID: PAYTM_CHANNEL_ID,
    ORDER_ID: orderId,
    CUST_ID: customerId,
    TXN_AMOUNT: amount.toString(),
    CALLBACK_URL: PAYTM_CALLBACK_URL,
  };

  // Generate the checksum
  const checksum = await PaytmChecksum.generateSignature(paytmParams, PAYTM_MERCHANT_KEY);
  paytmParams.CHECKSUMHASH = checksum;

  try {
    const response = await paytmClient.post('/theia/processTransaction', paytmParams);
    return response.data;
  } catch (error) {
    console.error('Error initiating Paytm payment:', error.response?.data || error.message);
    throw new Error('Failed to initiate Paytm payment');
  }
};

// Function to verify Paytm payment
const verifyPaytmPayment = async (paytmParams) => {
  const isValidChecksum = PaytmChecksum.verifySignature(paytmParams, PAYTM_MERCHANT_KEY, paytmParams.CHECKSUMHASH);

  if (isValidChecksum) {
    if (paytmParams.STATUS === 'TXN_SUCCESS') {
      return { success: true, ...paytmParams };
    } else {
      return { success: false, error: 'Transaction failed' };
    }
  } else {
    throw new Error('Invalid Paytm checksum');
  }
};

// Export functions
module.exports = {
  initiatePaytmPayment,
  verifyPaytmPayment,
};
