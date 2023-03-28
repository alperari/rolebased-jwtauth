const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to check if user is authenticated
requireAuth = (req, res, next) => {
  // TODO: USE COOKIES INSTEAD OF HEADERS
  //   const token = req.cookies.token;
  const token =
    req.headers.authorization &&
    req.headers.authorization.split(' ')[0] == 'Bearer' &&
    req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, function (err, user) {
    if (err) return res.sendStatus(401);

    req.user = user;
    next();
  });
};

// Middleware to check if user is authenticated and is a product manager
requireProductManager = (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.sendStatus(401); //Unauthorized
  }

  if (user.role !== 'productManager') {
    return res.sendStatus(403); //Forbidden
  }

  next();
};

// Middleware to check if user is authenticated and is a sales manager
requireSalesManager = (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.sendStatus(401); //Unauthorized
  }

  if (user.role !== 'salesManager') {
    return res.sendStatus(403); //Forbidden
  }

  next();
};

// Middleware to check if user is authenticated and is an admin
requireAdmin = (req, res, next) => {
  const { user } = req;

  if (!user) {
    return res.sendStatus(401); //Unauthorized
  }

  if (user.role !== 'admin') {
    return res.sendStatus(403); //Forbidden
  }

  next();
};

module.exports = {
  requireAuth,
  requireProductManager,
  requireSalesManager,
  requireAdmin,
};
