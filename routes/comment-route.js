// Create comment router

const { Router } = require('express');
const Comment = require('../models/comment-model');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Gett my comments for a product
// TODO: only authenticated users can get their comments
router.get('/my/:productID', requireAuth, async (req, res) => {
  const { productID } = req.params;
  const { user } = req;

  try {
    const myComments = await Comment.find({
      productID,
      userID: user.id,
    });

    res.status(200).json({ myComments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all comments for a product
// TODO: only product owners can get all comments
router.get('/all/:productID', async (req, res) => {
  const { productID } = req.params;

  try {
    const comments = await Comment.find({ productID });
    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all approved comments for a product
// Everyone
router.get('/approved/:productID', async (req, res) => {
  const { productID } = req.params;

  try {
    const comments = await Comment.find({ productID, status: 'approved' });

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all pending comments for a product
// TODO: only product managers can get pending comments
router.get('/pending/:productID', async (req, res) => {
  const { productID } = req.params;

  try {
    const comments = await Comment.find({ productID, status: 'pending' });

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all rejected comments for a product
// TODO: only product managers can get rejected comments
router.get('/rejected/:productID', async (req, res) => {
  const { productID } = req.params;

  try {
    const comments = await Comment.find({ productID, status: 'rejected' });

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Create comment
// TODO: authenticated users can create comments
router.post('/', async (req, res) => {
  const { userID, productID, content } = req.body;
  const newComment = await Comment.create({
    userID,
    productID,
    content,
  });
  res.status(200).json({ newComment });
  try {
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Update comment
// TODO: authenticated users can update THEIR comments
router.patch('/:id', async (req, res) => {
  const { userID, description } = req.body;
  const { id } = req.params;

  try {
    // update comment whose id is id and userId is userID
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: id, userID },
      { description },
      { new: true }
    );

    res.status(200).json({ updatedComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Delete comment
// TODO: authenticated users can delete THEIR comments
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedComment = await Comment.findOneAndDelete({ _id: id, userID });

    res.status(200).json({ deletedComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Approve/Reject (a.k.a. process) comment
// TODO: only product managers can approve/reject comments
router.patch('/process/:id', async (req, res) => {
  const { newStatus } = req.body;

  try {
    const updatedComment = await Comment.findOneAndUpdate(
      { _id: id },
      { status: newStatus },
      { new: true }
    );

    res.status(200).json({ updatedComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

module.exports = router;
