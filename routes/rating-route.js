const express = require('express');
const Rating = require('../models/rating-model');
const Product = require('../models/product-model');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get all ratings for a product
// Everyone
router.get('/all/:productID', async (req, res) => {
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
    const ratings = await Rating.find({ productID });

    res.status(200).json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Create rating for a product
// Only authenticated users can create ratings
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;

  const { productID, stars } = req.body;

  if (!productID || !stars) {
    console.error('Product ID and stars are required');
    return res.status(400).json({ error: 'Product ID and stars are required' });
  }

  // Check if product with productID exists
  const product = await Product.findById(productID);

  if (!product) {
    console.error('Product does not exist');
    return res.status(400).json({ error: 'Product does not exist' });
  }

  try {
    // Create new rating
    const newRating = await Rating.create({
      userID: user._id,
      productID,
      stars,
    });

    res.status(200).json({ newRating });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Delete rating
// Only authenticated users can delete their ratings
router.delete('/id/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!id) {
    console.error('Rating ID is required');
    return res.status(400).json({ error: 'Rating ID is required' });
  }

  // Check if rating with id exists
  const Rating = await Rating.findById(id);

  if (!Rating) {
    console.error('Rating does not exist');
    return res.status(400).json({ error: 'Rating does not exist' });
  }

  try {
    // Delete rating whose id is id and userID is user._id
    const deletedRating = await Rating.findOneAndDelete({
      _id: id,
      userID: user._id,
    });

    res.status(200).json({ deletedRating });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
