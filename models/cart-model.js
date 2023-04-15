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
  // [
  //   {
  //     productID:1,
  //     quantity:1,
  //   },
  //   {
  //     productID:2,
  //     quantity:2,
  //   },

  // ]
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
