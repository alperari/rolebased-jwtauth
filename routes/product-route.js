const { Router } = require('express');
const cloudinary = require('cloudinary').v2;

// Mongoose models
const Product = require('../models/product-model');
const Rating = require('../models/rating-model');
const Cart = require('../models/cart-model');

// Middlewares
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Create product
router.post('/', async (req, res) => {
  const {
    name,
    description,
    category,
    image,
    quantity,
    model,
    distributor,
    warrantyStatus,
  } = req.body;

  try {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(image, {
      upload_preset: 'e-commerce',
      resource_type: 'image',
    });

    const imageURL = result.secure_url;

    // Create product
    const product = await Product.create({
      name,
      price: -1, // Product price will be set by sales manager later
      description,
      category,
      imageURL,
      quantity,
      model,
      distributor,
      warrantyStatus,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Update product price
// TODO: Only sales manager can update product price
router.patch('/:id', async (req, res) => {
  const { price } = req.body;
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, {
      price,
    });
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

module.exports = router;
