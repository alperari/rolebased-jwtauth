const express = require('express');
const Order = require('../models/order-model');
const User = require('../models/user-model');

const Product = require('../models/product-model');
const Refund = require('../models/refund-model');

const { requireAuth, requireSManager } = require('../middlewares/auth');

const { transporter } = require('../utils/nodemailer');

const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Create refund request for a product in a "delivered" order
// Only authenticated users
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { orderID, productID } = req.body;

  if (!orderID || !productID) {
    return res.status(400).json({ error: 'Invalid inputs' });
  }

  try {
    // Check if the order with OrderID exists
    const order = await Order.findById(orderID);

    if (!order) {
      return res.status(400).json({ error: 'Order does not exist' });
    }

    // Check if order belongs to user
    if (order.userID !== user._id) {
      return res.status(400).json({ error: 'Order does not belong to user' });
    }

    // Check if order status is 'delivered'
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Order status is not delivered' });
    }

    // Check if the product with productID exists
    const product = await Product.findById(productID);

    if (!product) {
      return res.status(400).json({ error: 'Product does not exist' });
    }

    // Check if product belongs to order
    const productInOrder = order.products.find(
      (prod) => prod.productID == productID
    );

    if (!productInOrder) {
      return res
        .status(400)
        .json({ error: 'Product does not belong to order' });
    }

    // Check if the order is within 30 days of delivery
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = new Date(Date.now() - thirtyDays);

    if (order.date < thirtyDaysAgo) {
      return res.status(400).json({ error: 'Order is more than 30 days old' });
    }

    // Create new refund (with status: "pending" by default)
    const newRefund = await Refund.create({
      userID: user._id,
      orderID,
      productID,
      quantity: productInOrder.quantity, // This quantity will be returned back to stock
      price: productInOrder.buyPrice, // This amount of money will be returned back to user's balance
    });

    res.status(200).json({ newRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get refund status for each product in an order by orderID
// Only authenticated users
router.get('/order/:orderID', requireAuth, async (req, res) => {
  const { user } = req;
  const { orderID } = req.params;

  try {
    const order = await Order.findById(orderID);

    // Check if order with orderID exists
    if (!order) {
      return res.status(400).json({ error: 'Order does not exist' });
    }

    // Check if order belongs to user
    if (order.userID !== user._id) {
      return res.status(400).json({ error: 'Order does not belong to user' });
    }

    const productIDs = order.products.map((element) => element.productID);

    const refunds = [];

    for (const productID of productIDs) {
      // Get refund status for each product in this order
      let refund = await Refund.findOne({ orderID, productID });

      if (!refund) {
        refund = {
          productID: productID,
          status: 'none',
        };
      }

      refunds.push(refund);
    }

    res.status(200).json({ refunds });

    // Get refund status for each product in this order
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all refunds
// Only sales managers can see all refunds
router.get('/all', requireAuth, requireSManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find();

    // Get user details for each refund
    for (const refund of refunds) {
      const user = await User.findById(refund.userID).select('name email');
      refund._doc.user = user;
    }

    // Get product details for each refund
    for (const refund of refunds) {
      const productDetails = await Product.findById(refund.productID).select(
        'name imageURL distributor'
      );

      refund._doc.productDetails = productDetails;
    }

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all pending refunds
// Only sales managers can see all pending refunds
router.get('/pending', requireAuth, requireSManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'pending' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all approved refunds
// Only sales managers can see all approved refunds
router.get('/approved', requireAuth, requireSManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'approved' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all rejected refunds
// Only sales managers can see all rejected refunds
router.get('/rejected', requireAuth, requireSManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'rejected' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get my refunds
// Only authenticated users
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ userID: user._id });

    // Fetch product details for products in each refund

    for (const refund of refunds) {
      const productDetails = await Product.findById(refund.productID).select(
        'name imageURL distributor'
      );

      refund._doc.productDetails = productDetails;
    }

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Approve a refund
// Only sales managers can update refund status approve
router.patch('/approve', requireAuth, requireSManager, async (req, res) => {
  const { refundID } = req.body;

  if (!refundID) {
    console.error('Refund ID is required');
    return res.status(400).json({ error: 'Refund ID is required' });
  }

  try {
    const refund = await Refund.findById(refundID);

    // Check if refund with refundID exists
    if (!refund) {
      console.error('Refund does not exist');
      return res.status(400).json({ error: 'Refund does not exist' });
    }

    // Check if refund status is "pending"
    if (refund.status != 'pending') {
      console.error('Refund is not pending');
      return res.status(400).json({ error: 'Refund is not pending' });
    }

    // Update refund status
    const updatedRefund = await Refund.findByIdAndUpdate(
      { _id: refundID },
      { status: 'approved' },
      { new: true }
    );

    // Increase product stock quantity
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: refund.productID },
      { $inc: { quantity: refund.quantity } },
      { new: true }
    );

    // Increase user's account balance
    const updatedUser = await User.findByIdAndUpdate(
      { _id: refund.userID },
      { $inc: { balance: refund.price } },
      { new: true }
    );

    // Send approval to user's email
    await sendApprovalEmail(updatedUser, updatedRefund, updatedProduct);

    res.status(200).json({ updatedRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Reject a refund
// Only sales managers can update refund status reject
router.patch('/reject', requireAuth, requireSManager, async (req, res) => {
  const { user } = req;
  const { refundID } = req.body;

  if (!refundID) {
    console.error('Refund ID is required');
    return res.status(400).json({ error: 'Refund ID is required' });
  }

  try {
    const refund = await Refund.findById(refundID);

    // Check if refund with refundID exists
    if (!refund) {
      console.error('Refund does not exist');
      return res.status(400).json({ error: 'Refund does not exist' });
    }

    // Check if refund status is "pending"
    if (refund.status != 'pending') {
      console.error('Refund is not pending');

      return res.status(400).json({ error: 'Refund is not pending' });
    }

    // Update refund status
    const updatedRefund = await Refund.findByIdAndUpdate(
      { _id: refundID },
      { status: 'rejected' },
      { new: true }
    );

    return res.status(200).json({ updatedRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Delete refund
// Only authenticated users can delete their ("pending") refunds
router.delete('/delete', requireAuth, async (req, res) => {
  const { user } = req;
  const { orderID, productID } = req.body;

  if (!orderID || !productID) {
    console.error('Order ID and Product ID are required');
    return res
      .status(400)
      .json({ error: 'Order ID and Product ID are required' });
  }

  try {
    const refund = await Refund.findOne({ orderID, productID });

    // Check if refund with refundID exists
    if (!refund) {
      console.error('Refund does not exist');
      return res.status(400).json({ error: 'Refund does not exist' });
    }

    // Check if refund belongs to the user
    if (refund.userID != user._id) {
      console.error('Refund does not belong to the user');
      return res
        .status(400)
        .json({ error: 'Refund does not belong to the user' });
    }

    // Check if refund status is "pending"
    if (refund.status != 'pending') {
      console.error('Refund is not pending');
      return res.status(400).json({ error: 'Refund is not pending' });
    }

    // Delete refund
    const deletedRefund = await Refund.findByIdAndDelete(refund._id);

    return res.status(200).json({ deletedRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Send email to user
const sendApprovalEmail = async (user, refund, product) => {
  let messageHTML = '<h2>Your Refund Request Is Accepted!</h2>';
  messageHTML += `
        <div>
          <p>Refund ID: <b>${refund._id} </b></p>
          <p>Order ID: <b>${refund.orderID} </b></p>
          <p>Refunded Product Name: <b>${product.name} </b></p>
          <p>Refunded Product ID: <b>${product._id} </b></p>
          <p>Refunded Product Quantity: <b>${refund.quantity} </b></p>
          <p>Product Price: <b>$${refund.price / refund.quantity} </b></p>
          <img src="${product.imageURL}" alt="${product.name}" width="100px" />
          <br>
          <h4>$${refund.price} has been refunded to your account balance.</h4>
          <p>Thank you for shopping with us!</p>
        </div>
      `;

  const message = {
    from: NODEMAILER_EMAIL,
    to: user.email,
    subject: 'Refund Approved!',
    html: messageHTML,
  };

  transporter.sendMail(message, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = router;
