const { Router } = require('express');
const Wishlist = require('../models/wishlist-model');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my wishlist
router.get('/', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const wishlist = await Wishlist.find({ userID: user.id });

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

// Add product to wishlist
// Only authenticated users
router.patch('/add/:productID', requireAuth, async (req, res) => {
  const { productID } = req.params;
  const { user } = req;

  try {
    const wishlist = await Wishlist.findOne({ userID: user.id });
    const productIndex = wishlist.products.indexOf(productID);

    if (productIndex === -1) {
      wishlist.products.push(productID);
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
  const { productID } = req.params;
  const { user } = req;

  try {
    const wishlist = await Wishlist.findOne({ userID: user.id });
    const productIndex = wishlist.products.indexOf(productID);

    if (productIndex !== -1) {
      wishlist.products.splice(productIndex, 1);
    }

    await wishlist.save();

    return res.json({ wishlist });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});
