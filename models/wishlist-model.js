const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  productIDs: {
    type: Array,
    required: true,
  },
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
