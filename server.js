require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '20mb',
  })
);
app.use(
  bodyParser.json({
    limit: '20mb',
  })
);

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware for checking JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Sample data for two users
const users = [
  {
    username: 'admin',
    password: 'admin',
    roles: ['user', 'admin'],
  },
  {
    username: 'user',
    password: 'user',
    roles: ['user'],
  },
];

// Login endpoint
app.post('/login', (req, res) => {
  // Check username and password
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return res.sendStatus(401);

  // Generate JWT token
  const accessToken = jwt.sign(
    { username: user.username, roles: user.roles },
    JWT_SECRET
  );
  res.json({ accessToken });
});

app.get('/', (req, res) => {
  return res.json('home');
});

// Admin-only endpoint
app.get('/admin-only', authenticateToken, (req, res) => {
  const user = req.user;

  if (!user) return res.sendStatus(403);

  if (!user.roles.contains('admin')) return res.sendStatus(403);
  res.send('Admin Dashboard');
});

// User-only endpoint
app.get('/user-only', authenticateToken, (req, res) => {
  const user = req.user;

  if (!user) return res.sendStatus(403);

  if (!req.user.role.contains('user')) return res.sendStatus(403);
  res.send('User Dashboard');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
