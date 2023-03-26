require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env['PORT'] | 3000;
const SESSION_KEY = process.env.SESSION_KEY;
const MONGO_URI = process.env.MONGO_URI;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

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

// Cloudinary configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    app.listen(PORT);
    console.log('mongoose connected succesfully');
    console.log('listening on port:', PORT);

    // Base
    app.get('/', (req, res) => {
      return res.json('ok');
    });

    // Routes Here
    const authRouter = require('./routes/auth-route');
    const userRouter = require('./routes/user-route');

    app.use('/auth', authRouter);
    app.use('/user', userRouter);
  })
  .catch((error) => {
    console.log(error);
    console.log('mongoose connection failed');
  });
