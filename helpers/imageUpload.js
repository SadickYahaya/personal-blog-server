const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const isProduction = process.env.NODE_ENV === 'production';

let storage;

if (isProduction) {
  // Configure Cloudinary for production
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'portfolio_uploads', // You can change this folder name
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    },
  });
} else {
  // Use local storage for development
  const uploadPath = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadPath, { recursive: true });

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({ storage: storage });

module.exports = { upload, isProduction };