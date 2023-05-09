const express = require('express');
const Order = require('../models/order-model');
const Product = require('../models/product-model');
const Cart = require('../models/cart-model');
const {
  requireAuth,
  requireSManager,
  requirePManager,
} = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get order by id
// Only authenticated users
router.get('/id/:id', requireAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  try {
    const order = await Order.findById(id);

    // Check if order exists
    if (!order) {
      console.error('Order not found');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if this order belongs to the user (admins and sales managers are exceptions)
    if (
      user.role !== 'admin' &&
      user.role !== 'salesManager' &&
      order.userID != user._id
    ) {
      console.error('Unauthorized');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get product details

    const productsInDB = await Product.find({
      _id: { $in: order.products.map((element) => element.productID) },
    }).select({ imageURL: 1, name: 1, distributor: 1, category: 1 });

    const productsWithDetails = [];

    for (let product of order.products) {
      const productDetails = productsInDB.find(
        (element) => element._id == product.productID
      );

      const productDetails_doc = productDetails._doc;

      product = {
        cartQuantity: product.quantity,
        buyPrice: product.buyPrice,
        ...productDetails_doc,
      };

      productsWithDetails.push(product);
    }

    order._doc.products = productsWithDetails;

    res.status(200).json({ order });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Get my orders
// Only authenticated users
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const orders = await Order.find({ userID: user._id }).sort({
      date: -1,
    });

    // Get product details for each order

    for (const order of orders) {
      const productsInDB = await Product.find({
        _id: { $in: order.products.map((element) => element.productID) },
      }).select({ imageURL: 1, name: 1, distributor: 1, category: 1 });

      const productsWithDetails = [];

      for (let product of order.products) {
        const productDetails = productsInDB.find(
          (element) => element._id == product.productID
        );

        const productDetails_doc = productDetails._doc;

        product = {
          cartQuantity: product.quantity,
          buyPrice: product.buyPrice,
          ...productDetails_doc,
        };

        productsWithDetails.push(product);
      }

      order._doc.products = productsWithDetails;
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Place order
// Only authenticated users
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { products, creditCard, address, contact } = req.body;

  // Validate inputs are valid
  if (!products || !creditCard || !address || !contact) {
    console.error('Invalid inputs');
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  // Check if productIDs are valid
  const productsInDB = await Product.find({
    _id: { $in: products.map((element) => element.productID) },
  });

  if (productsInDB.length !== products.length) {
    console.error('Invalid product IDs');
    return res.status(400).json({ error: 'Invalid product IDs' });
  }

  // Validate if all products have a quantity and price
  const isValid = products.reduce((accumulator, currentValue) => {
    accumulator =
      currentValue.buyPrice != null &&
      currentValue.buyPrice > 0 &&
      currentValue.quantity != null &&
      currentValue.buyPrice > 0 &&
      accumulator;

    return accumulator;
  }, true);

  if (!isValid) {
    console.error('Invalid product prices & quantities');
    return res
      .status(400)
      .json({ error: 'Invalid product prices & quantities' });
  }

  // Validate if all products have sufficient quantity in stock
  const isSufficient = products.reduce((accumulator, currentValue) => {
    const product = productsInDB.find(
      (prod) => prod._id == currentValue.productID
    );

    accumulator = product.quantity >= currentValue.quantity && accumulator;

    return accumulator;
  }, true);

  if (!isSufficient) {
    console.error('Insufficient quantity in stock');
    return res.status(400).json({ error: 'Insufficient quantity in stock' });
  }

  try {
    //  Create order
    const order = await Order.create({
      userID: user._id,
      products,
      creditCard,
      last4digits: creditCard.slice(-4),
      address,
      receiverEmail: user.email,
      contact,
    });

    // Decrease quantity of products in stock
    products.forEach(async (product) => {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product.productID },
        { $inc: { quantity: -product.quantity } },
        { new: true }
      );
    });

    // Empty user's cart
    const updatedCart = await Cart.findOneAndUpdate(
      { userID: user._id },
      { products: [] },
      { new: true }
    );

    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all orders
// Only sales managers
router.get('/all', requireAuth, requirePManager, async (req, res) => {
  try {
    const orders = await Order.find().sort({
      date: -1,
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// Cancel my processing order
// Only authenticated users
router.patch('/cancel', requireAuth, async (req, res) => {
  const { user } = req;
  const { orderID } = req.body;
  try {
    // Get order
    const order = await Order.findById(orderID);

    if (!order) {
      console.error('Order does not exist');
      return res.status(400).json({ error: 'Order does not exist' });
    }

    // Check if order belongs to user

    if (order.userID !== user._id) {
      console.error('Order does not belong to user');
      return res.status(400).json({ error: 'Order does not belong to user' });
    }

    // Check if order status is 'processing'
    if (order.status !== 'processing') {
      console.error('Order status is not processing');
      return res.status(400).json({ error: 'Order status is not processing' });
    }

    // Cancel order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, userID: user._id },
      { status: 'cancelled' },
      { new: true }
    );

    // Increase quantity of products in stock
    for (const product of order.products) {
      await Product.findOneAndUpdate(
        { _id: product.productID },
        { $inc: { quantity: product.quantity } },
        { new: true }
      );
    }

    res.status(200).json({ updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Update status of an order
// Only sales maangers
router.patch('/update', requireAuth, requirePManager, async (req, res) => {
  const { user } = req;
  const { orderID, newStatus } = req.body;

  if (!orderID || !newStatus) {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  try {
    // Check if the order with OrderID exists
    const order = await Order.findById(orderID);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exist' });
    }

    // Check if newStatus is valid
    const validStatuses = [
      'processing',
      'in-transit',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid new status' });
    }

    // Update order status
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderID },
      { status: newStatus },
      { new: true }
    );

    res.status(200).json({ updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get sales information of a product
router.get('/product-sales', requireAuth, requireSManager, async (req, res) => {
  const { productID } = req.query;

  if (!productID) {
    console.error('Invalid inputs');
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  try {
    // Get all orders (except cancelled) that contain the product
    const orders = await Order.find({
      'products.productID': productID,
      status: { $ne: 'cancelled' },
    });

    const sales = [];

    orders.forEach((order) => {
      sales.push({
        date: order.date.toISOString().split('T')[0],
        quantity: order.products.find(
          (product) => product.productID == productID
        ).quantity,
        buyPrice: order.products.find(
          (product) => product.productID == productID
        ).buyPrice,
      });
    });

    res.status(200).json({ sales });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get receipts from sales of a product
router.get(
  '/receipts/id/:id',
  // requireAuth,
  // requireSManager,
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      console.error('Invalid inputs');
      return res.status(400).json({ error: 'Invalid inputs' });
    }

    try {
      // Get all orders (except cancelled) that contain the product
      const orders = await Order.find({
        'products.productID': id,
        status: { $ne: 'cancelled' },
      });

      const receipts = orders.map((order) => {
        return {
          orderID: order._id,
          date: order.date,
          quantity: order.products.find((product) => product.productID == id)
            .quantity,
          buyPrice: order.products.find((product) => product.productID == id)
            .buyPrice,
          userID: order.userID,
          receiptURL: order.receiptURL,
        };
      });

      res.status(200).json({ receipts });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
