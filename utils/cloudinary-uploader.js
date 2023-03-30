const cloudinary = require('../utils/cloudinary');
const PDFDocument = require('pdfkit');

// Upload PDF (here it is receipt) to cloudinary and return secure URL
const uploadPDF = async (order) => {
  // Create PDF
  const doc = new PDFDocument();
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  doc.on('end', () => {
    uploadFromBuffer(Buffer.concat(buffers));
  });

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

  const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
    resource_type: 'image',
    upload_preset: 'uzvxfwtx',
    folder: 'products',
  });

  return result.secure_url;
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

let uploadFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'foo',
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
