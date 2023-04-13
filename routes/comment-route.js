// Create comment router

const { Router } = require('express');
const Comment = require('../models/comment-model');
const Product = require('../models/product-model');
const User = require('../models/user-model');

const {
  requireAuth,
  requireSManager,
  requirePManager,
} = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my comments for a product
// Only authenticated users can get their comments
router.get('/my-comments/:productID', requireAuth, async (req, res) => {
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

// Get all of my comments, with product info for each comment
router.get('/my-comments', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    // Get all of my comments
    const myComments = await Comment.find({ userID: user._id });

    // Get product info for each comment
    for (let comment of myComments) {
      // Get product info
      const product = await Product.findById(comment.productID);

      // Add product info to comment
      comment._doc.product = product;
    }

    res.status(200).json({ myComments });
  } catch (error) {
    console.error(error);

    res.status(400).json({ error: error.message });
  }
});

// Get all comments for a product
// TODO: Fix that: Only product managers can get all comments
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

// Get all comments, with user info and product info for each comment
// Only product managers can get all comments
router.get('/all', requireAuth, requirePManager, async (req, res) => {
  try {
    // Get all comments
    const comments = await Comment.find();

    // Get user info for each comment
    for (let comment of comments) {
      // Get user info
      const user = await User.findById(comment.userID);

      // Get product info
      const product = await Product.findById(comment.productID);

      // Add user info and product info to comment
      comment._doc.user = user;
      comment._doc.product = product;
    }

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

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
    title,
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
router.delete('/id/:commentID', requireAuth, async (req, res) => {
  const { user } = req;
  const { commentID } = req.params;

  if (!commentID) {
    console.error('commentID is required');
    return res.status(400).json({ error: 'commentID is required' });
  }

  // Check if comment with id exists
  const comment = await Comment.findById(commentID);

  if (!comment) {
    console.error('Comment does not exist');
    return res.status(400).json({ error: 'Comment does not exist' });
  }

  try {
    // Delete comment whose id is commentID and userId is userID
    const deletedComment = await Comment.findOneAndDelete({
      _id: commentID,
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
  '/update-status/id/:commentID',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { commentID } = req.params;
    const { newStatus } = req.body;

    if (!commentID || !newStatus) {
      console.error('ID and new status are required');
      return res.status(400).json({ error: 'ID and new status are required' });
    }

    try {
      // Update comment whose id is commentID
      const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentID },
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
