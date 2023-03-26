const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  imageURL: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  distributor: {
    type: String,
    required: true,
  },
  warrantyStatus: {
    type: String,
  },
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
