const { Router } = require('express');

// Mongoose models
const Product = require('../models/product-model');
const Rating = require('../models/rating-model');
const Cart = require('../models/cart-model');

// Middlewares
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

//Create product
router.post('/', async (req, res) => {
  const {
    name,
    price,
    description,
    category,
    imageData,
    quantity,
    model,
    distributor,
    warrantyStatus,
  } = req.body;
  try {
    //Create product but use Product model in this repository

    const product = await Product.create({
      name,
      price,
      description,
      category,
      imageURL,
      quantity,
      model,
      distributor,
      warrantyStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Get all ratings for a product
router.get('/:id/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find({ productID: req.params.id });
    res.status(200).json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Get all products in a cart
router.get('/:id/cart', async (req, res) => {
  try {
    const cart = await Cart.find({ userID: req.params.id });
    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Add a product to a cart
router.post('/:id/cart', async (req, res) => {
  const { userID, productID } = req.body;
  try {
    const cart = await Cart.create({
      userID,
      productID,
    });
    res.status(201).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Delete a product from a cart
router.delete('/:id/cart', async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
