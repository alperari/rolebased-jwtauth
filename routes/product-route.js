const { Router } = require('express');
const cloudinary = require('cloudinary').v2;

// Mongoose models
const Product = require('../models/product-model');
const Rating = require('../models/rating-model');
const Cart = require('../models/cart-model');
const User = require('../models/user-model');
const Wishlist = require('../models/wishlist-model');

const { transporter } = require('../utils/nodemailer');
const { uploadImage } = require('../utils/cloudinary-uploader');

const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;

// Middlewares
const {
  requireAuth,
  requireSManager,
  requirePManager,
} = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get a single product
// Everyone
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await Product.findById(id);
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all products
// Everyone
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get products under a category
// Everyone
router.get('/category/:category', async (req, res) => {
  const category = req.params.category;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const products = await Product.find({
      category,
    });
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Get all categories dynamically
// Everyone
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Create product
// Only product manager can create product
router.post('/', requireAuth, requirePManager, async (req, res) => {
  const {
    name,
    description,
    category,
    // image,
    model,
    distributor,
    warrantyStatus,
  } = req.body;

  const image = req.files.image;
  try {
    // Upload image to cloudinary and get secure URL

    const imageURL = await uploadImage(image);

    // Create product
    const product = await Product.create({
      name,
      price: -1, // Product price will be set by sales manager later
      discount: 0, // Product discount will be set by sales manager later
      description,
      category,
      imageURL,
      quantity: 0, // Product quantity will be set by product manager later
      model,
      distributor,
      warrantyStatus,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Update product price & discount
// Only sales manager can update product price & discount
router.patch('/update/', requireAuth, requireSManager, async (req, res) => {
  const { price, discount, id } = req.body;

  if (price == null || discount == null) {
    return res.status(400).json({ error: 'Price or discount is missing' });
  }

  if (price < 0 || discount < 0) {
    return res.status(400).json({ error: 'Price or discount is invalid' });
  }

  try {
    const filter = { _id: id };
    const update = {};

    if (price > 0) {
      update.price = price;
    }

    if (discount > 0) {
      update.discount = discount;
    }

    const updatedProduct = await Product.findByIdAndUpdate(filter, update, {
      new: true, // new:true will return updated document
    });

    if (discount > 0) {
      // Notify users who have this product in their wishlist
      await notifyUsers(updatedProduct);
    }

    res.status(200).json({ updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Delete a product
// Only product manager can delete a product
router.delete('/:id', requireAuth, requirePManager, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Delete product
    const deletedProduct = await Product.findByIdAndDelete(id);

    res.status(200).json({ deletedProduct });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
});

// Functions ---------------------------------------------------------------

const notifyUsers = async (product) => {
  try {
    // Get all wishlists that have this product
    const wishlists = await Wishlist.find({
      productIDs: { $in: [product.id] },
    });

    const userIDs = wishlists.map((wishlist) => wishlist.userID);

    const newPrice = product.price - (product.price * product.discount) / 100;

    // Get all users who have this product in their wishlist
    const users = await User.find({ _id: { $in: userIDs } });

    // Send email to all users
    for (const user of users) {
      // Create the HTML for the email message
      let messageHTML =
        '<h2>One Of Your Wishlist Item Has Been Discounted!</h2>';
      messageHTML += `
        <div>
          <h3><b>${product.name} </b></h3>
          <p>ID: <b>${product._id} </b></p>
          <p>Description: <b>${product.description} </b></p>
          <p>Discount: <b><b>${product.discount} </b>%</p>
          <p>Previous before discount: <b>${product.price} </b></p>
          <p>Price after discount: <b>${newPrice}</p>
          <img src="${product.imageURL}" alt="${product.name}" width="100px" />
        </div>
      `;

      const message = {
        from: NODEMAILER_EMAIL,
        to: user.email,
        subject: 'Wishlist Item Discounted!',
        html: messageHTML,
      };

      transporter.sendMail(message, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = router;
