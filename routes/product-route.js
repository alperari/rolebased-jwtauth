const { Router } = require('express');
const cloudinary = require('cloudinary').v2;

// Mongoose models
const Product = require('../models/product-model');
const Rating = require('../models/rating-model');
const Cart = require('../models/cart-model');
const User = require('../models/user-model');
const Wishlist = require('../models/wishlist-model');
const Order = require('../models/order-model');

const { transporter } = require('../utils/nodemailer');
const { uploadImage } = require('../utils/cloudinary-uploader');

const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;

// Middlewares
const {
  checkAuth,
  requireAuth,
  requireSManager,
  requirePManager,
  requireManager,
} = require('../middlewares/auth');

const router = Router();

// Endpoints--------------------------------------------------------------

// Get a single product
// Everyone
router.get('/id/:id', checkAuth, async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await Product.findById(id);

    let inMyWishlist = false;

    if (user) {
      const userWishlist = await Wishlist.findOne({ userID: user._id });

      inMyWishlist = userWishlist.productIDs.find((productID) => {
        return productID.toString() === product._id.toString();
      });
    }

    product._doc.inMyWishlist = inMyWishlist;

    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/is-commentable-ratable', requireAuth, async (req, res) => {
  const { user } = req;
  const { productID } = req.query;

  try {
    const product = await Product.findById(productID);

    if (!product) {
      console.error('Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }

    const order = await Order.findOne({
      userID: user._id,
      products: { $elemMatch: { productID: productID } },
      status: 'delivered',
    });

    if (!order) {
      return res.status(200).json(false);
    }

    return res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all products
// Everyone
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get all products with their comments
// Everyone
router.get('/with-ratings', requireAuth, requireManager, async (req, res) => {
  try {
    let products = await Product.find();

    // Get ratings for each product
    for (let product of products) {
      const ratings = await Rating.find({ productID: product._id });

      product._doc.ratings = ratings;
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Get only listed products, with their comments
// Sales Manager & Product Manager & admin
router.get(
  '/listed/with-ratings',

  async (req, res) => {
    try {
      let products = await Product.find({ price: { $gt: -1 } });

      // Get ratings for each product
      for (let product of products) {
        const ratings = await Rating.find({ productID: product._id });

        product._doc.ratings = ratings;
      }

      res.status(200).json({ products });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

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
    res.status(400).json({ error: error.message });
  }
});

// Get all categories dynamically
// Everyone
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.collection.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Create product
// Only product manager can create product
router.post('/', requireAuth, requirePManager, async (req, res) => {
  const { name, description, category, distributor } = req.body;

  const image = req.files.image;

  try {
    // Upload image to cloudinary and get secure URL

    const imageURL = await uploadImage(image);

    // Create product
    const product = await Product.create({
      name,
      description,
      category,
      imageURL,
      distributor,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Update product price & discount
// Only sales manager can update product price & discount
router.patch(
  '/update-price-discount',
  requireAuth,
  requireSManager,
  async (req, res) => {
    const { price, discount, productID } = req.body;

    if (!productID) {
      console.error('Product ID is missing');
      return res.status(400).json({ error: 'Product ID is missing' });
    }

    if (price == null && discount == null) {
      console.error('Price or discount is missing');
      return res.status(400).json({ error: 'Price or discount is missing' });
    }

    if (price < 0 || discount < 0 || discount > 100) {
      console.error('Price or discount is invalid');
      return res.status(400).json({ error: 'Price or discount is invalid' });
    }

    try {
      const product = await Product.findById(productID);

      if (!product) {
        console.error('Product not found');
        return res.status(404).json({ error: 'Product not found' });
      }

      const filter = { _id: productID };
      const update = {};

      if (price !== null && price >= 0) {
        update.price = price;

        // If price was set to -1, then the product was not listed
        // This means that the product will be listed now
        // So cost will be updated (half of the initial price)
        if (product.price === -1) {
          update.cost = price / 2;
        }
      }

      if (discount !== null && discount >= 0) {
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
      res.status(400).json({ error: error.message });
    }
  }
);

router.patch(
  '/update-quantity',
  requireAuth,
  requirePManager,
  async (req, res) => {
    const { quantity, productID } = req.body;

    if (quantity == null) {
      return res.status(400).json({ error: 'Quantity is missing' });
    }

    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity is invalid' });
    }

    try {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productID },
        { quantity },
        { new: true }
      );

      res.status(200).json({ updatedProduct });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Delete a product
// Only product manager can delete a product
router.delete('/id/:id', requireAuth, requirePManager, async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

// Functions ---------------------------------------------------------------

const notifyUsers = async (product) => {
  console.log('Discounted item! Notifying users...');
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
          <p>Price before discount: <b>${product.price} </b></p>
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
