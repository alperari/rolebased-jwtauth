const { Router } = require('express');
const Cart = require('../models/cart-model');
const Product = require('../models/product-model');

// Middlewares
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my cart (with product details by fetching their data from products collection)
// Only authenticated users can get their cart
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    // Get cart
    const cart = await Cart.findOne({ userID: user._id });

    const cartProductIds = cart.products.map((element) => element.productID);

    // If cart is empty, return empty cart
    if (cartProductIds.length === 0) {
      return res.status(200).json({ cart });
    }

    // Get details of each product
    const products = await Product.find({
      _id: { $in: cartProductIds },
    }).select({
      name: 1,
      price: 1,
      discount: 1,
      imageURL: 1,
      description: 1,
      category: 1,
    });

    // Add product details to cart
    cart.products.forEach((element) => {
      const product = products.find(
        (product) => product._id == element.productID
      );

      element.productDetails = product;
    });

    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Add product to cart
// Only authenticated users
router.post('/add', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID, quantity } = req.body;

  if (!productID || !quantity || quantity <= 0) {
    console.error('Product ID and quantity are required');
    return res
      .status(400)
      .json({ error: 'Product ID and quantity are required' });
  }

  try {
    // Check if product with productID exists
    const product = await Product.findById(productID);

    if (!product) {
      console.error('Product does not exist');
      return res.status(400).json({ error: 'Product does not exist' });
    }

    // Check if the product has enough quantity
    if (product.quantity < quantity) {
      console.error('Product does not have enough quantity');
      return res
        .status(400)
        .json({ error: 'Product does not have enough quantity' });
    }

    // Get cart
    const cart = await Cart.findOne({ userID: user._id });

    // Check if product is already in cart
    const productIndex = cart.products.findIndex(
      (element) => element.productID == productID
    );

    // If product is already in cart, update quantity
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += quantity;
    }
    // If product is not in cart, add it
    else {
      cart.products.push({ productID, quantity });
    }

    // Update my cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userID: user._id },
      { products: cart.products },
      { new: true }
    );

    // // Update product quantity
    // const reducedQuantity = product.quantity - quantity;
    // const updatedProduct = await Product.findOneAndUpdate(
    //   { _id: productID },
    //   { quantity: reducedQuantity },
    //   { new: true }
    // );

    return res.status(200).json({ updatedCart });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Remove product from cart
// Only authenticated users
router.delete('/remove', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.body;

  if (!productID) {
    console.error('Product ID is required');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Check if product with productID exists
    const product = await Product.findById(productID);

    if (!product) {
      console.error('Product does not exist');
      return res.status(400).json({ error: 'Product does not exist' });
    }

    // Get cart
    const cart = await Cart.findOne({ userID: user._id });

    // Check if product is in cart
    const productIndex = cart.products.findIndex(
      (element) => element.productID == productID
    );

    // If product is not in cart, return error
    if (productIndex === -1) {
      console.error('Product is not in cart');
      return res.status(400).json({ error: 'Product is not in cart' });
    }

    // Remove product from cart
    cart.products.splice(productIndex, 1);

    // Update my cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userID: user._id },
      { products: cart.products },
      { new: true }
    );

    return res.status(200).json({ updatedCart });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
