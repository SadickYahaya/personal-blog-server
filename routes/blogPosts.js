const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File name with timestamp
  }
});

const upload = multer({ storage });

// Create a new blog post
router.post('/', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); // Debugging: Check if file is uploaded
  console.log('Body:', req.body); // Debugging: Check if other fields are correct

  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  try {
    const blogPost = new BlogPost({
      title: req.body.title,
      author: req.body.author,
      date: req.body.date,
      description: req.body.description,
      image: req.file.path // Save the file path to the database
    });
    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();
    res.json(blogPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    res.json(blogPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a blog post by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); // Debugging: Check if file is uploaded
  console.log('Body:', req.body); // Debugging: Check if other fields are correct

  const updatedData = {
    title: req.body.title,
    author: req.body.author,
    date: req.body.date,
    description: req.body.description,
  };

  if (req.file) {
    updatedData.image = req.file.path;
  }

  try {
    const blogPost = await BlogPost.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    res.json(blogPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a blog post by ID
router.delete('/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findByIdAndDelete(req.params.id);
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    res.json({ message: 'Blog post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
