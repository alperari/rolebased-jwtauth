const { Router } = require('express');
const User = require('../models/user-model');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get my user
router.get('/', requireAuth, async (req, res) => {
  const { user } = req;

  return res.json({ user });
});

// Get other user
// TODO: only authenticated users can get other users
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = User.findById(id);

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error });
  }
});

module.exports = router;
