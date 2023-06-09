const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const refundSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  orderID: {
    type: String,
    required: true,
  },

  productID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  receiptURL: {
    type: String,
  },
});

const Refund = mongoose.model('Refund', refundSchema);
module.exports = Refund;
