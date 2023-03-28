const express = require('express');
const Order = require('../models/order-model');
const Refund = require('..models/refund-model');
const Product = require('../models/product-model');
const { requireAuth, requireSalesManager } = require('../middlewares/auth');

const router = express.Router();

// Endpoints--------------------------------------------------------------

// Get all refunds
// Only sales managers can see all refunds
router.get('/all', requireAuth, requireSalesManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find();

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all pending refunds
// Only sales managers can see all pending refunds
router.get('/pending', requireAuth, requireSalesManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'pending' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all approved refunds
// Only sales managers can see all approved refunds
router.get('/approved', requireAuth, requireSalesManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'approved' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all rejected refunds
// Only sales managers can see all rejected refunds
router.get('/rejected', requireAuth, requireSalesManager, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ status: 'rejected' });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get my refunds
// Only authenticated users
router.get('/my', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const refunds = await Refund.find({ userID: user._id });

    res.status(200).json({ refunds });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Approve a refund
// Only sales managers can update refund status approve
router.patch('/approve', requireAuth, requireSalesManager, async (req, res) => {
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
      { status: 'approved' },
      { new: true }
    );

    // Increase product stock quantity
    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: refund.productID },
      { $inc: { quantity: refund.quantity } },
      { new: true }
    );

    // TODO: Send approval email to user
    // TODO: Increase user's wallet balance?

    res.status(200).json({ updatedRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Reject a refund
// Only sales managers can update refund status reject
router.patch('/reject', requireAuth, requireSalesManager, async (req, res) => {
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
    res.status(400).json({ error });
  }
});

// Delete refund
// Only authenticated users can delete ("pending") refunds
router.delete('/delete', requireAuth, async (req, res) => {
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
    const deletedRefund = await Refund.findByIdAndDelete(refundID);

    return res.status(200).json({ deletedRefund });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});
