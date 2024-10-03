const express = require('express');
const router = express.Router();
const upload = require('../helpers/imageUpload');

router.post('/', upload.single('image'), (req, res) => {
  if (req.file) {
    const filePath = `/uploads/${req.file.filename}`;
    console.log('File uploaded successfully');
    console.log('File path:', filePath);
    res.json({ message: 'File uploaded successfully', filePath: filePath });
  } else {
    console.log('File upload failed');
    res.status(400).json({ message: 'File upload failed' });
  }
});

module.exports = router;
