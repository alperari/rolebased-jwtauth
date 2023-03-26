const { Router } = require('express');
const User = require('../models/user-model');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { user } = req;

  return res.json({ user });
});

module.exports = router;
