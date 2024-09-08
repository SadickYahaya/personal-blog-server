const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const BlogPost = require('../models/BlogPost');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); 
  console.log('Body:', req.body); 

  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  try {
    // Normalize the image path to use forward slashes
    const imagePath = req.file.path.replace(/\\/g, '/');
    
    const blogPost = new BlogPost({
      title: req.body.title,
      author: req.body.author,
      date: req.body.date,
      description: req.body.description,
      image: imagePath
    });
    
    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (err) {
    console.error('Error saving blog post:', err); 
    res.status(500).json({ message: err.message });
  }
});


// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();
    res.json(blogPosts);
  } catch (err) {
    console.error('Error fetching blog posts:', err); 
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
    console.error('Error fetching blog post:', err); // More detailed logging
    res.status(500).json({ message: err.message });
  }
});

// Update a blog post by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); 
  console.log('Body:', req.body); 

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
    console.error('Error updating blog post:', err); // More detailed logging
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
    console.error('Error deleting blog post:', err); // More detailed logging
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
