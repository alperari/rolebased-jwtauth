const { Router } = require('express');
const User = require('../models/user-model');
const Wishlist = require('../models/wishlist-model');
const Cart = require('../models/cart-model');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

const generateToken = (user) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  const header = {
    algorithm: 'HS256',
    expiresIn: '15d',
  };

  return jwt.sign(user.toJSON(), JWT_SECRET, header);
};

// Endpoints--------------------------------------------------------------

router.get('/test-cookie', (req, res) => {
  // Make sure all requests are sent with credentials (withCredentials: true)
  const token = req.cookies.token;
  console.log({ token });
  res.json({ token });
});

router.post('/register', async (req, res) => {
  const { name, username, email, password, address, role } = req.body;
  try {
    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password,
      address,
      role,
    });

    // Create wishlist for user
    const wishlist = await Wishlist.create({
      userID: user._id,
      productIDs: [],
    });

    // Create cart for user
    const cart = await Cart.create({
      userID: user._id,
      products: [],
    });

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true, //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).send('Invalid inputs');

  try {
    // Use mongoose static login method
    const user = await User.login(email, password);

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true, //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(201).json({ user: user, token: token });
  } catch (error) {
    console.log(error);
    // If .login static method fails to match password, it will throw an error.
    // Otherwise, it will return user
    res.status(400).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
