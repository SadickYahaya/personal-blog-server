const express = require('express');
const router = express.Router();
const { upload, isProduction } = require('../helpers/imageUpload');

router.post('/', upload.single('image'), (req, res) => {
  if (req.file) {
    let imageUrl;
    if (isProduction) {
      // In production, Cloudinary returns the image URL in req.file.path
      imageUrl = req.file.path;
    } else {
      // In development, construct the URL for the locally saved file
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    console.log('File uploaded successfully');
    console.log('Image URL:', imageUrl);
    res.json({ message: 'File uploaded successfully', imageUrl: imageUrl });
  } else {
    console.log('File upload failed');
    res.status(400).json({ message: 'File upload failed' });
  }
});

module.exports = router;
