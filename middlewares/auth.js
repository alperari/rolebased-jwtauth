const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const JWT_SECRET = process.env.JWT_SECRET;

requireAuth = (req, res, next) => {
  // TODO: USE COOKIES INSTEAD OF HEADERS
  //   const token = req.cookies.token;
  const token =
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] == 'Bearer' &&
    req.headers.authorization.split(' ')[1];

  if (!token) {
    if (err) return res.sendStatus(403);
  }

  jwt.verify(token, JWT_SECRET, function (err, user) {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
};

module.exports = { requireAuth };
