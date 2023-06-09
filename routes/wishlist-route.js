const { Router } = require('express');
const Wishlist = require('../models/wishlist-model');
const Product = require('../models/product-model');

// Middlewares
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my wishlist
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    // Fetch productIDs from wishlist
    let wishlist = await Wishlist.findOne({ userID: user._id });

    // Fetch products details
    const products = await Product.find({
      _id: { $in: wishlist._doc.productIDs },
    });

    delete wishlist._doc.productIDs;
    delete wishlist._doc.userID;

    wishlist._doc.products = products;

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Add product to wishlist
// Only authenticated users
router.patch('/add', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.body;

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
    return res.status(400).json({ error: error.message });
  }
});

// Remove product from wishlist
// Only authenticated users
router.patch('/remove', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.body;

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
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
