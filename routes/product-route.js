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
// Everyone
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await Product.findById(id);
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all products
// Everyone
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get products under a category
// Everyone
router.get('/category/:category', async (req, res) => {
  const category = req.params.category;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const products = await Product.find({
      category,
    });
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all categories dynamically
// Everyone
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Create product
// TODO: Only product manager can create product
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

// Update product price & discount
// TODO: Only sales manager can update product price & discount
router.patch('/:id', async (req, res) => {
  const { price, discount } = req.body;

  if (!price || !discount) {
    return res.status(400).json({ error: 'Price or discount is missing' });
  }

  try {
    const update = {};

    if (price > 0) {
      update.price = price;
    }

    if (discount > 0) {
      update.discount = discount;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      update
    );
    res.status(200).json({ updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

//Get all ratings for a product
router.get('/:id/ratings', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is missing' });
  }

  try {
    const ratings = await Rating.find({ productID: id });
    res.status(200).json({ ratings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
