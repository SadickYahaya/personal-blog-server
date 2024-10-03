const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadPath = process.env.NODE_ENV === 'production'
  ? '/opt/render/project/src/uploads/'
  : path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;