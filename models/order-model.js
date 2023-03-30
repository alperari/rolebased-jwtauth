//Create order mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PDFDocument = require('pdfkit');
const axios = require('axios');
const bcrypt = require('bcrypt');

const { transporter } = require('../utils/nodemailer');
const { uploadPDF } = require('../utils/cloudinary-uploader');

const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;

const orderSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  products: {
    //[{id: 1, quantity: 2, price: 100}]
    type: Array,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'in-transit', 'delivered', 'cancelled'],
    default: 'processing',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  creditCard: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  receiverEmail: {
    type: String,
    required: true,
  },
  receiptURL: {
    type: String,
    default: '',
  },
});

// Hooks ----------------------------------------
orderSchema.pre('save', async function (next) {
  try {
    // 1-Generate receipt as PDF
    // and upload it to cloudinary
    // then save the URL to the document

    const { uploadResult, buffers } = await uploadPDF(this);

    if (uploadResult.error) {
      next(uploadResult.error);
    }

    this.receiptURL = uploadResult.secure_url;

    // 2-Send receipt to the user's email as a PDF
    const message = {
      from: NODEMAILER_EMAIL,
      to: this.receiverEmail,
      subject: 'Your Receipt',
      text: 'Please find the receipt PDF file attached.',
      attachments: [
        {
          filename: 'receipt.pdf',
          content: Buffer.concat(buffers),
        },
      ],
    };

    // 3-Encrypt credit card information
    const salt = await bcrypt.genSalt();
    this.creditCard = await bcrypt.hash(this.creditCard, salt);

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });

    next();
  } catch (err) {
    next(err);
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
