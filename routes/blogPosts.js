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
  try {
    const subscribers = await Subscriber.find().select('email');
    
    console.log('Email configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: '********' // Don't log the actual password
      },
    });

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify the connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    for (let subscriber of subscribers) {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: subscriber.email,
        subject: `${blogPost.title}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; }
              .meta { font-style: italic; color: #7f8c8d; }
              .description { margin: 20px 0; }
              .cta-button { display: inline-block; background-color: #3498db; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>${blogPost.title}</h1>
            <p class="meta">By ${blogPost.author} on ${new Date(blogPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div class="description">${blogPost.description}</div>
            <a href="${process.env.FRONTEND_URL}/blog/${blogPost._id}" class="cta-button">Read More</a>
          </body>
          </html>
        `,
      });
    }
    console.log('All newsletter emails sent successfully');
  } catch (error) {
    console.error('Error sending newsletter emails:', error);
    throw error;
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
