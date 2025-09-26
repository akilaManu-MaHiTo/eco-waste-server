const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  merchant_id: {
    type: String,
    required: true
  },
  order_id: {
    type: String,
    required: true
  },
  payment_id: {
    type: String,
    required: true,
    unique: true
  },
  payhere_amount: {
    type: Number,
    required: true
  },
  payhere_currency: {
    type: String,
    enum: ['LKR', 'USD', 'GBP', 'EUR', 'AUD'],
    required: true
  },
  status_code: {
    type: Number,
    enum: [2, 0, -1, -2, -3],
    required: true
  },
  md5sig: {
    type: String,
    required: true
  },
  custom_1: {
    type: String,
    default: ''
  },
  custom_2: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    enum: ['VISA', 'MASTER', 'AMEX', 'EZCASH', 'MCASH', 'GENIE', 'VISHWA', 'PAYAPP', 'HNB', 'FRIMI'],
    required: true
  },
  status_message: {
    type: String,
    required: true
  },
  // Optional card details if payment made via credit/debit card
  card_holder_name: {
    type: String,
    default: null
  },
  card_no: {
    type: String,
    default: null
  },
  card_expiry: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
