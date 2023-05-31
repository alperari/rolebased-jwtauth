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
    default: -1,
  },
  discount: {
    type: Number,
    default: 0,
  },
  cost: {
    type: Number,
    required: true,
    default: 0,
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
    default: 0,
  },
  distributor: {
    type: String,
    required: true,
  },
});

// Hooks
productSchema.pre('remove', function (next) {
  const product = this;

  // update all wishlists that contain the product id
  mongoose
    .model('Wishlist')
    .updateMany(
      { products: product._id },
      { $pull: { products: product._id } },
      next
    );

  // update all carts that contain the product id
  mongoose
    .model('Cart')
    .updateMany(
      { products: product._id },
      { $pull: { products: product._id } },
      next
    );

  // remove all ratings that contain the product id
  mongoose.model('Rating').deleteMany({ productID: product._id }, next);

  // remove all "pending" refunds that contain the product id
  mongoose
    .model('Refund')
    .deleteMany({ productID: product._id, status: 'pending' }, next);

  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
