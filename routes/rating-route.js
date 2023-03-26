const express = require('express');
const Rating = require('../models/rating-model');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get all ratings for a product
// Everyone
router.get('/all/:productID', async (req, res) => {
  const { productID } = req.params;

  try {
    const ratings = await Rating.find({ productID });

    res.status(200).json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Create rating
// TODO: only customers can create ratings
router.post('/', async (req, res) => {
  const { userID, productID, start } = req.body;

  try {
    const newRating = await Rating.create({
      userID,
      productID,
      start,
    });

    res.status(200).json({ newRating });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Delete rating
// TODO: only rating owners can delete their ratings
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRating = await Rating.findByIdAndDelete(id);

    res.status(200).json({ deletedRating });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
