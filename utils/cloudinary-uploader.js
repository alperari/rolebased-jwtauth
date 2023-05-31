const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const axios = require('axios');
const streamifier = require('streamifier');

const Product = require('../models/product-model');

// Upload PDF (here it is receipt) to cloudinary and return secure URL
const uploadPDF_order = async (order) => {
  let uploadResult = false;

  const doc = new PDFDocument();
  let buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  // Create PDF content  ----------------------------------------
  doc
    .font('Times-Roman')
    .fontSize(18)
    .text('Receipt', { align: 'center' })
    .moveDown(0.5);
  doc
    .fontSize(14)
    .text(`This is electronically generated receipt for your order: `, {
      align: 'center',
    });

  doc
    .font('Courier')
    .fillColor('grey')
    .fontSize(12)
    .text(`${order.id}`, { align: 'center' })
    .moveDown(2);

  doc
    .lineCap('butt')
    .moveTo(50, 140)
    .lineTo(doc.page.width - 50, 140)
    .stroke();

  doc
    .font('Times-Roman')
    .fillColor('black')
    .fontSize(14)
    .text(`Order & Shipping Details`, { align: 'center' })
    .moveDown(0.5);
  doc.fontSize(12).text(`Address: ${order.address}`).moveDown(0.5);
  doc.fontSize(12).text(`Date: ${order.date}`).moveDown(0.5);
  doc
    .fontSize(12)
    .text(`Credit Card: ${'**** **** **** ' + order.creditCard.slice(-4)}`)
    .moveDown(0.5);
  doc.fontSize(12).text(`Email: ${order.receiverEmail}`).moveDown(2);

  doc
    .lineCap('butt')
    .moveTo(50, 260)
    .lineTo(doc.page.width - 50, 260)
    .stroke();

  doc.fontSize(14).text('Products', { align: 'center' }).moveDown(1);

  for (const element of order.products) {
    const product = await Product.findById(element.productID);

    const image = await axios.get(product.imageURL, {
      responseType: 'arraybuffer',
    });
    doc
      .image(image.data, { align: 'center', width: 100, valign: 'center' })
      .moveDown(0.5);
    doc.fontSize(12).text(`Product ID: ${product.id}`).moveDown(0.5);
    doc.fontSize(12).text(`Product Name: ${product.name}`).moveDown(0.5);
    doc.fontSize(12).text(`Price: ${element.buyPrice}`).moveDown(0.5);
    doc.fontSize(12).text(`Quantity: ${element.quantity}`).moveDown(0.5);
    doc
      .fontSize(12)
      .text(
        '--------------------------------------------------------------------------------------',
        {
          align: 'center',
        }
      )
      .moveDown(0.5);
  }

  // Image

  doc.end();
  // Finish PDF content  ----------------------------------------

  doc.on('end', async () => {
    // When PDF is ready, upload it to cloudinary
    try {
      const result = await uploadFromBuffer(
        Buffer.concat(buffers),
        'order_' + order.id,
        'pdf',
        'receipts',
        'raw',
        true
      );

      uploadResult = result;
    } catch (error) {
      console.log(error);
      console.log('Failed to upload receipt PDF to cloudinary!');
      uploadResult = { error };
    }
  });

  while (!uploadResult) {
    console.log('Uploading receipt PDF to cloudinary. This might take time...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log('Receipt PDF is uploaded.');
  return { uploadResult, buffers };
};

const uploadPDF_refund = async (refund, product) => {
  let uploadResult = false;

  const doc = new PDFDocument();
  let buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  // Create PDF content  ----------------------------------------
  doc
    .font('Times-Roman')
    .fontSize(18)
    .text('Receipt', { align: 'center' })
    .moveDown(0.5);
  doc
    .fontSize(14)
    .text(`This is electronically generated receipt for your refund: `, {
      align: 'center',
    });

  doc
    .font('Courier')
    .fillColor('grey')
    .fontSize(12)
    .text(`${refund.id}`, { align: 'center' })
    .moveDown(2);

  doc
    .lineCap('butt')
    .moveTo(50, 140)
    .lineTo(doc.page.width - 50, 140)
    .stroke();

  doc
    .font('Times-Roman')
    .fillColor('black')
    .fontSize(14)
    .text(`Refund Details`, { align: 'center' })
    .moveDown(0.5);
  doc.fontSize(12).text(`Date: ${refund.date}`).moveDown(0.5);

  doc
    .lineCap('butt')
    .moveTo(50, 260)
    .lineTo(doc.page.width - 50, 260)
    .stroke();

  doc.fontSize(14).text('Products', { align: 'center' }).moveDown(1);

  doc.fontSize(12).text(`Order ID: ${refund.orderID}`).moveDown(0.5);
  doc.fontSize(12).text(`Refunded Product Name: ${product.name}`).moveDown(0.5);
  doc
    .fontSize(12)
    .text(`Refunded Product Price: ${refund.total / refund.quantity}`)
    .moveDown(0.5);
  doc
    .fontSize(12)
    .text(`Refunded Product Quantity: ${refund.quantity}`)
    .moveDown(0.5);

  const image = await axios.get(product.imageURL, {
    responseType: 'arraybuffer',
  });
  doc
    .image(image.data, { align: 'center', width: 100, valign: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(
      '--------------------------------------------------------------------------------------',
      {
        align: 'center',
      }
    )
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(`${refund.total} has been refunded to your account balance.`)
    .moveDown(0.5);

  // Image

  doc.end();
  // Finish PDF content  ----------------------------------------

  doc.on('end', async () => {
    // When PDF is ready, upload it to cloudinary
    try {
      const result = await uploadFromBuffer(
        Buffer.concat(buffers),
        'refund_' + refund.id,
        'pdf',
        'receipts',
        'raw',
        true
      );

      uploadResult = result;
    } catch (error) {
      console.log(error);
      console.log('Failed to upload receipt PDF to cloudinary!');
      uploadResult = { error };
    }
  });

  while (!uploadResult) {
    console.log('Uploading receipt PDF to cloudinary. This might take time...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log('Receipt PDF is uploaded.');
  return { uploadResult, buffers };
};

// Upload image to cloudinary and return secure URL
const uploadImage = async (imageFile) => {
  try {
    const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      resource_type: 'image',
      upload_preset: 'uzvxfwtx',
      folder: 'products',
      format: 'jpg',
    });

    return result.secure_url;
  } catch (error) {
    console.error(error);
    return error;
  }
};

let uploadFromBuffer = (
  buffer,
  public_id,
  format,
  folderName,
  resourceType,
  hasPages
) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        public_id: public_id,
        folder: folderName,
        resource_type: resourceType,
        pages: hasPages,
        format: format,
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

module.exports = { uploadPDF_order, uploadPDF_refund, uploadImage };
