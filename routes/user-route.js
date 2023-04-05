const { Router } = require('express');
const User = require('../models/user-model');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const bcrypt = require('bcrypt');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my user
router.get('/me', requireAuth, async (req, res) => {
  const { user } = req;

  return res.json({ user });
});

// Get other user
// Only authenticated users can get other users
router.get('/id/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    console.error('ID is required');
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const user = User.findById(id);

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Update my user
// Only authenticated users can update their user
router.patch('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    console.error('Nothing to update');
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const filter = { _id: user._id };
  const update = {};

  name ? (update.name = name) : null;
  email ? (update.email = email) : null;
  password ? (update.password = password) : null;

  try {
    const updatedUser = await User.findByIdAndUpdate(filter, update, {
      new: true,
    });

    return res.json({ updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

// Delete any user
// Only admins can delete users
router.delete('/id/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    console.error('ID is required');
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    return res.json({ deletedUser });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
