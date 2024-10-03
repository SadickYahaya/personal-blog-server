const multer = require('multer');
const path = require('path');
const fs = require('fs');

const configureStorage = () => {
  const uploadPath = process.env.NODE_ENV === 'production'
    ? '/opt/render/project/src/uploads/'
    : path.join(process.cwd(), 'uploads');

  // Ensure the upload directory exists
  fs.mkdirSync(uploadPath, { recursive: true });

  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
};

const upload = multer({ storage: configureStorage() });

module.exports = upload;