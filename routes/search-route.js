const express = require('express');
const Rating = require('../models/rating-model');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Create endpoint for searching products by their name and description
// Everyone
router.get('/products', async (req, res) => {
  const { query } = req.query;

  // If empty query, return all products
  if (!query) {
    const products = await Product.find();
    return res.status(200).json({ products });
  }

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
