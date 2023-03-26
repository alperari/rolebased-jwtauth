//Create order mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PDFDocument = require('pdfkit');
const request = require('request');
const blobStream = require('blob-stream');
const buffer = require('buffer');

const { transporter } = require('../utils/nodemailer');

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
    enum: ['processing', 'in-transit', 'delivered'],
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
});

orderSchema.post('save', function (doc, next) {
  console.log('Order saved: ', doc.id);
  next();
});

orderSchema.statics.sendReceipt = async function (user) {
  // TODO: Send receipt to the user's email as a PDF
  console.log("Sending receipt to user's email:", 'alperari@sabanciuniv.edu');

  const doc = new PDFDocument();
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  doc.on('end', () => {
    const message = {
      from: NODEMAILER_EMAIL,
      to: 'alperari@sabanciuniv.edu',
      subject: 'Your Receipt',
      text: 'Please find the PDF file attached.',
      attachments: [
        {
          filename: 'receipt.pdf',
          content: Buffer.concat(buffers),
        },
      ],
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  });
  doc.text('Hello, World!');
  doc.end();
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
