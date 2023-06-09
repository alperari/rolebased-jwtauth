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
    let cart = await Cart.findOne({ userID: user._id });

    const cartProductIds = cart.products.map((element) => element.productID);

    // If cart is empty, return empty cart
    if (cartProductIds.length === 0) {
      return res.status(200).json({ cart });
    }

    // Get details of each product
    const products = await Product.find({
      _id: { $in: cartProductIds },
    });

    // Add product details to cart
    cart.products.forEach((element, index) => {
      const productDetails = products.find(
        (product) => product._id == element.productID
      );

      element.cartQuantity = element.quantity;

      delete element.quantity;
      delete element.productID;

      const productDetails_doc = productDetails._doc;

      delete productDetails_doc.__v;

      cart.products[index] = { ...element, ...productDetails_doc };
    });

    cart = { products: cart.products };

    res.status(200).json({ cart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/sync', requireAuth, async (req, res) => {
  const { user } = req;
  const { localStorageCart } = req.body;

  if (!localStorageCart) {
    console.error('Invalid local storage cart');
    return res.status(400).json({ error: 'Invalid local storage cart' });
  }

  try {
    // Get cart
    const cart = await Cart.findOne({ userID: user._id });

    const newCartProducts = cart.products;

    localStorageCart.products.forEach((element) => {
      const foundItem = newCartProducts.find(
        (item) => item.productID === element._id
      );

      if (!foundItem) {
        newCartProducts.push({
          productID: element._id,
          quantity: element.cartQuantity,
        });
      }
    });

    const cartProductIds = newCartProducts.map((element) => element.productID);

    // If cart is empty, return empty cart
    if (cartProductIds.length === 0) {
      return res.status(200).json({ cart });
    }

    // Get details of each product
    const products = await Product.find({
      _id: { $in: cartProductIds },
    });

    const syncedCart = {
      products: [],
    };

    // Add product details to cart
    newCartProducts.forEach((element, index) => {
      const productDetails = products.find(
        (product) => product._id == element.productID
      );

      const productDetails_doc = productDetails._doc;

      delete productDetails_doc.__v;

      syncedCart.products.push({
        cartQuantity: element.quantity,
        ...productDetails_doc,
      });
    });

    // Update my cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userID: user._id },
      { products: newCartProducts },
      { new: true }
    );

    res.status(200).json({ syncedCart });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Add product to cart (by quantity)
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

    return res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Remove product from cart (by quantity)
// Only authenticated users
router.delete('/remove', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID, quantity } = req.body;

  if (!productID || !quantity || quantity <= 0) {
    console.error('Invalid productID or quantity');
    return res.status(400).json({ error: 'Invalid productID or quantity' });
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

    // Reduce quantity from cart
    cart.products[productIndex].quantity -= quantity;

    // If quantity is 0, remove product from cart
    if (cart.products[productIndex].quantity <= 0) {
      cart.products.splice(productIndex, 1);
    }

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

// Clear cart
// Only authenticated users
router.delete('/clear', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    // Get cart
    const cart = await Cart.findOne({ userID: user._id });

    // Clear cart
    cart.products = [];

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
