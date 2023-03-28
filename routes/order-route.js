// Create order route

const express = require('express');
const Order = require('../models/order-model');
const Product = require('../models/product-model');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get my orders
// Only authenticated users
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const orders = await Order.find({ userID: user._id });
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Place order
// Only authenticated users
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { products, creditCard, address } = req.body;

  // Validate inputs are valid
  if (!products || !creditCard || !address) {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  // Check if productIDs are valid
  const productsInDB = await Product.find({
    _id: { $in: products.map((element) => element._id) },
  });

  if (productsInDB.length !== products.length) {
    return res.status(400).json({ error: 'Invalid product IDs' });
  }

  // Validate if all products have a quantity and price
  const isValid = products.reduce((accumulator, currentValue) => {
    accumulator =
      currentValue.price != null &&
      currentValue.price > 0 &&
      currentValue.quantity != null &&
      currentValue.price > 0 &&
      accumulator;

    return accumulator;
  }, true);

  if (!isValid) {
    return res
      .status(400)
      .json({ error: 'Invalid product prices & quantities' });
  }

  // Validate if all products have sufficient quantity in stock
  const isSufficient = products.reduce((accumulator, currentValue) => {
    const product = productsInDB.find(
      (product) => product._id == currentValue._id
    );

    accumulator = product.quantity >= currentValue.quantity && accumulator;

    return accumulator;
  }, true);

  if (!isSufficient) {
    return res.status(400).json({ error: 'Insufficient quantity in stock' });
  }

  try {
    //  Create order
    const newOrder = await Order.create({
      userID: user._id,
      products,
      creditCard,
      address,
    });

    // Send receipt to user's email, attached as a PDF document
    Order.sendReceipt(user);

    // Decrease quantity of products in stock
    products.forEach(async (product) => {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id },
        { $inc: { quantity: -product.quantity } },
        { new: true }
      );
    });

    // Empty user's cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userID: user._id },
      { products: [] },
      { new: true }
    );

    res.status(200).json({ newOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Cancel processing order
// Only authenticated users
router.patch('/cancel', requireAuth, async (req, res) => {
  const { user } = req;
  const { orderID } = req.body;

  try {
    // Get order
    const order = await Order.findById(orderID);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exist' });
    }

    // Check if order belongs to user
    if (order.userID !== user._id) {
      return res.status(400).json({ error: 'Order does not belong to user' });
    }

    // Check if order status is 'processing'
    if (order.status !== 'processing') {
      return res.status(400).json({ error: 'Order status is not processing' });
    }

    // Cancel order
    const updatedCart = await Cart.findOneAndUpdate(
      { _id: order._id, userID: user._id },
      { status: 'cancelled' },
      { new: true }
    );

    // Increase quantity of products in stock
    order.products.forEach(async (product) => {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id },
        { $inc: { quantity: product.quantity } },
        { new: true }
      );
    });

    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
