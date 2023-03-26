//Create rating mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  productID: {
    type: String,
    required: true,
  },
  stars: {
    type: Number,
    required: true,
  },
});

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
