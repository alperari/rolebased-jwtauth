const { Router } = require('express');
const Wishlist = require('../models/wishlist-model');
const Product = require('../models/product-model');

// Middlewares
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my wishlist
router.get('/', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const wishlist = await Wishlist.find({ userID: user._id });

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

// Add product to wishlist
// Only authenticated users
router.patch('/add/:productID', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.params;

  if (!productID) {
    console.error('Product ID is required');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if product with productID exists
  const product = await Product.findById(productID);

  if (!product) {
    console.error('Product does not exist');
    return res.status(400).json({ error: 'Product does not exist' });
  }

  try {
    const wishlist = await Wishlist.findOne({ userID: user._id });
    const productIndex = wishlist.productIDs.indexOf(productID);

    if (productIndex === -1) {
      wishlist.productIDs.push(productID);
    }

    await wishlist.save();

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

// Remove product from wishlist
// Only authenticated users
router.patch('/remove/:productID', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.params;

  if (!productID) {
    console.error('Product ID is required');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check if product with productID exists
  const product = await Product.findById(productID);

  if (!product) {
    console.error('Product does not exist');
    return res.status(400).json({ error: 'Product does not exist' });
  }

  try {
    const wishlist = await Wishlist.findOne({ userID: user._id });
    const productIndex = wishlist.productIDs.indexOf(productID);

    if (productIndex !== -1) {
      wishlist.productIDs.splice(productIndex, 1);
    }

    await wishlist.save();

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

module.exports = router;
