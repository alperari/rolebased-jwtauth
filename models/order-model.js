//Create order mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  products: {
    //[{id: 1, quantity: 2, price: 100}]
    type: Array,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'in-transit', 'delivered'],
  },
  date: {
    type: Date,
    required: true,
  },
  creditCard: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});
