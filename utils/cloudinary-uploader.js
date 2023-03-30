const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const axios = require('axios');
const streamifier = require('streamifier');

// Upload PDF (here it is receipt) to cloudinary and return secure URL
const uploadPDF = async (order) => {
  // Create PDF

  let result = false;

  const doc = new PDFDocument();
  let buffers = [];

  doc.on('data', buffers.push.bind(buffers));

  // PDF content comes here ---------------------
  doc.text('Hello, World!');
  doc.fontSize(14).text('Title', { align: 'center' }).moveDown(0.5);
  doc.fontSize(10).text('Description', { align: 'center' }).moveDown(0.5);

  // Image
  const image = await axios.get(
    'https://www.google.com/images/srpr/logo11w.png',
    {
      responseType: 'arraybuffer',
    }
  );

  doc.image(image.data, { align: 'center', height: 100 }).moveDown(0.5);

  doc.end();

  doc.on('end', async () => {
    // When PDF is ready, upload it to cloudinary
    try {
      const uploadResult = await uploadFromBuffer(
        Buffer.concat(buffers),
        'receipt_' + order.id,
        'receipts',
        'image',
        true
      );

      result = uploadResult;
    } catch (error) {
      console.log(error);
      result = { error };
    }
  });

  while (!result) {
    console.log('Uploading receipt PDF to cloudinary. This might take time...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log('Receipt PDF is uploaded.');
  return result;
};

// Upload image to cloudinary and return secure URL
const uploadImage = async (imageFile) => {
  try {
    const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      resource_type: 'image',
      upload_preset: 'uzvxfwtx',
      folder: 'products',
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

module.exports = { uploadPDF, uploadImage };
