//Create cart mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  products: {
    type: Array,
    required: true,
  },
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
