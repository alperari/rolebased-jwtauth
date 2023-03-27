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
    const orders = await Order.find({ userID: user._id });
    res.status(200).json({ orders });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Place order
// TODO: Only authenticated users
router.post('/', async (req, res) => {
  //   const { user } = req;
  const userID = 1;
  const { products, creditCard, address } = req.body;

  // Validate inputs are valid
  if (!products || !creditCard || !address) {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  // Validate productIDs are valid
  //   const productsInDB = await Product.find({
  //     _id: { $in: products.map((element) => element._id) },
  //   });

  //   if (productsInDB.length !== products.length) {
  //     return res.status(400).json({ error: 'Invalid product IDs' });
  //   }

  // Validate if all products has a quantity and price
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
      //   userID: user._id,
      userID,
      products,
      creditCard,
      address,
    });

    const user = {};
    Order.sendReceipt(user);

    res.status(200).json({ newOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
