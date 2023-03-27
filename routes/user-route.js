const { Router } = require('express');
const User = require('../models/user-model');
const { requireAuth } = require('../middlewares/auth');
const bcrypt = require('bcrypt');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my user
router.get('/', requireAuth, async (req, res) => {
  const { user } = req;

  return res.json({ user });
});

// Get other user
// Only authenticated users can get other users
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const user = User.findById(id);

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

// Update my user
// Only authenticated users can update their user
router.patch('/', requireAuth, async (req, res) => {
  const { user } = req;
  const { name, email, password } = req.body;

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
    return res.status(400).json({ error });
  }
});

module.exports = router;
