// Create comment router

const { Router } = require('express');
const Comment = require('../models/comment-model');
const Product = require('../models/product-model');

const {
  requireAuth,
  requireSManager,
  requirePManager,
} = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Gett my comments for a product
// Only authenticated users can get their comments
router.get('/my/:productID', requireAuth, async (req, res) => {
  const { user } = req;

  const { productID } = req.params;

  if (!productID) {
    console.error('Product ID is required');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const myComments = await Comment.find({
      productID,
      userID: user._id,
    });

    res.status(200).json({ myComments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all comments for a product
// Only product owners can get all comments
router.get(
  '/all/:productID',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { productID } = req.params;

    if (!productID) {
      console.error('Product ID is required');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
      const comments = await Comment.find({ productID });
      res.status(200).json({ comments });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all approved comments for a product
// Everyone
router.get('/approved/:productID', async (req, res) => {
  const { productID } = req.params;

  if (!productID) {
    console.error('Product ID is required');
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const comments = await Comment.find({ productID, status: 'approved' });

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all pending comments for a product
// Only product managers can get pending comments
router.get(
  '/pending/:productID',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { productID } = req.params;

    if (!productID) {
      console.error('Product ID is required');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
      const comments = await Comment.find({ productID, status: 'pending' });

      res.status(200).json({ comments });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all rejected comments for a product
// Only product managers can get rejected comments
router.get(
  '/rejected/:productID',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { productID } = req.params;

    if (!productID) {
      console.error('Product ID is required');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
      const comments = await Comment.find({ productID, status: 'rejected' });

      res.status(200).json({ comments });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Create comment
// Only authenticated users can create comments
router.post('/', requireAuth, async (req, res) => {
  const { user } = req;

  const { productID, title, description } = req.body;

  if (!productID || !description) {
    console.error('Product ID and description are required');
    return res
      .status(400)
      .json({ error: 'Product ID and description are required' });
  }

  // Check if product with productID exists
  const products = await Product.findById(productID);

  if (!products) {
    console.error('Product does not exist');
    return res.status(400).json({ error: 'Product does not exist' });
  }

  // Create comment
  const newComment = await Comment.create({
    userID: user._id,
    productID,
    description,
  });
  res.status(200).json({ newComment });
  try {
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Update comment
// Only authenticated users can update THEIR comments
router.patch('/:productID', requireAuth, async (req, res) => {
  const { user } = req;

  const { description } = req.body;
  const { productID } = req.params;

  if (!description || !id) {
    console.error('Description and ID are required');
    return res.status(400).json({ error: 'Description and ID are required' });
  }

  // Check if comment with id exists
  const comment = await Comment.findById(id);

  if (!comment) {
    console.error('Comment does not exist');
    return res.status(400).json({ error: 'Comment does not exist' });
  }

  try {
    // Update comment whose id is id and userId is userID
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: id, userID: user._id },
      { description },
      { new: true }
    );

    res.status(200).json({ updatedComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Delete comment
// Only authenticated users can delete THEIR comments
router.delete('/:productID', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.params;

  if (!id) {
    console.error('ID is required');
    return res.status(400).json({ error: 'ID is required' });
  }

  // Check if comment with id exists
  const comment = await Comment.findById(id);

  if (!comment) {
    console.error('Comment does not exist');
    return res.status(400).json({ error: 'Comment does not exist' });
  }

  try {
    // Delete comment whose id is id and userId is userID
    const deletedComment = await Comment.findOneAndDelete({
      _id: id,
      userID: user._id,
    });

    res.status(200).json({ deletedComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Approve/Reject (a.k.a. update) comment
// Only product managers can approve/reject comments
router.patch(
  '/update/:productID',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { productID } = req.params;
    const { newStatus } = req.body;

    if (!id || !newStatus) {
      console.error('ID and new status are required');
      return res.status(400).json({ error: 'ID and new status are required' });
    }

    try {
      // Update comment whose id is id and userId is userID
      const updatedComment = await Comment.findOneAndUpdate(
        { _id: id },
        { status: newStatus },
        { new: true }
      );

      res.status(200).json({ updatedComment });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
