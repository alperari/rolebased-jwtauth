const { Router } = require('express');
const User = require('../models/user-model');
const jwt = require('jsonwebtoken');

const router = Router();

const generateToken = (user) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  const header = {
    algorithm: 'HS256',
    expiresIn: '1m',
  };

  return jwt.sign(user.toJSON(), JWT_SECRET, header);
};

// Endpoints--------------------------------------------------------------

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

    const token = generateToken(user);

    res.cookie('token', token, {
      // httpOnly: true,  //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
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
      // httpOnly: true,  //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ payload: user, token: token });
  } catch (error) {
    console.log(error);
    // If .login static method fails to match password, it will throw an error.
    // Otherwise, it will return user
    res.status(400).json({ error });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
