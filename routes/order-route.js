// Create order route

const express = require('express');
const Order = require('../models/order-model');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get my orders
// Only authenticated users
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const orders = await Order.find({ userID: user.id });
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

  // Validate productIDs are valid
  const productsInDB = await Product.find({
    _id: { $in: products.map((element) => element._id) },
  });

  if (productsInDB.length !== products.length) {
    return res.status(400).json({ error: 'Invalid product IDs' });
  }

  // Validate all products will have a quantity and price
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

  try {
    const newOrder = await Order.create({
      userID: user.id,
      products,
      creditCard,
      address,
    });

    res.status(200).json({ newOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});
