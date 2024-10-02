const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Function to send newsletter emails
async function sendNewsletterEmails(blogPost) {
  const subscribers = await Subscriber.find().select('email');
  
  // Configure nodemailer (replace with your email service settings)
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  for (let subscriber of subscribers) {
    await transporter.sendMail({
      from: '"Your Blog Name" <your@email.com>',
      to: subscriber.email,
      subject: `New Blog Post: ${blogPost.title}`,
      html: `
        <h1>${blogPost.title}</h1>
        <p>By ${blogPost.author} on ${blogPost.date}</p>
        <p>${blogPost.description}</p>
        <a href="${process.env.FRONTEND_URL}/blog/${blogPost._id}">Read More</a>
      `,
    });
  }
}

// Create a new blog post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : '';
    const tagIds = req.body.tags ? req.body.tags.split(',') : [];

    const blogPost = new BlogPost({
      title: req.body.title,
      author: req.body.author,
      date: req.body.date,
      description: req.body.description,
      image: imagePath,
      tags: req.body.tags,
    });

    await blogPost.save();
    
    // Send newsletter emails
    await sendNewsletterEmails(blogPost);
    
    res.status(201).json(blogPost);
  } catch (err) {
    console.error('Error saving blog post:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogPosts = await BlogPost.find().populate('tags');
    res.json(blogPosts);
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).populate('tags');
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    res.json(blogPost);
  } catch (err) {
    console.error('Error fetching blog post:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a blog post by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  const updatedData = {
    title: req.body.title,
    author: req.body.author,
    date: req.body.date,
    description: req.body.description,
    tags: req.body.tags ? req.body.tags.split(',') : [],
  };

  if (req.file) {
    updatedData.image = req.file.path.replace(/\\/g, '/');
  }

  try {
    const blogPost = await BlogPost.findByIdAndUpdate(req.params.id, updatedData, { new: true }).populate('tags');
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    res.json(blogPost);
  } catch (err) {
    console.error('Error updating blog post:', err);
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
    console.error('Error deleting blog post:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
