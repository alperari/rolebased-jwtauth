const { Router } = require('express');
const router = Router();
const User = require('../models/user-model');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  const header = {
    algorithm: 'HS256',
    expiresIn: 1 * 24 * 60 * 60,
  };

  const payload = {
    id: id,
  };

  return jwt.sign(payload, JWT_SECRET, header);
};

router.post('/register', async (req, res) => {
  const { name, username, email, password, address, role } = req.body;
  try {
    const user = await User.create({
      name,
      username,
      email,
      password,
      address,
      role,
    });

    // Create jwt token on signup and redirect to home view
    const token = generateToken(user.id);

    res.cookie('token', token, {
      // httpOnly: true,  //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) res.status(400).send('Invalid inputs');

  try {
    // Use mongoose static login method
    const user = await User.login(email, password);

    const token = generateToken(user.id);

    res.cookie('token', token, {
      // httpOnly: true,  //if true: frontend cannot read token from cookies
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user });
  } catch (error) {
    // If .login static method fails to match password, it will throw an error.
    // Otherwise, it will return user
    res.status(400).send({ error: error });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
