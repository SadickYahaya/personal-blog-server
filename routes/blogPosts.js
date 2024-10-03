const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const Subscriber = require('../models/Subscriber');
const nodemailer = require('nodemailer');
const { upload } = require('../helpers/imageUpload');
const QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
const Comment = require('../models/Comment'); 

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
        pass: '********' 
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
      // Parse the description content
      const descriptionContent = JSON.parse(blogPost.description);
      
      // Convert Quill Delta to HTML
      const converter = new QuillDeltaToHtmlConverter(descriptionContent.ops, {});
      const descriptionHtml = converter.convert();

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
            <div class="description">${descriptionHtml}</div>
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
    console.log('Received file:', req.file);
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/${req.file.filename}`;
      console.log('Image URL:', imageUrl);
    }

    const blogPost = new BlogPost({
      title: req.body.title,
      author: req.body.author,
      date: req.body.date,
      description: req.body.description,
      image: imageUrl,
      tags: req.body.tags ? req.body.tags.split(',') : [],
    });

    await blogPost.save();
    console.log('Saved blog post:', blogPost);
    
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

router.get('/recent', async (req, res) => {
  try {
    const recentPosts = await BlogPost.find()
      .sort({ date: -1 })
      .limit(3)
      .populate('tags');
    if (recentPosts.length === 0) return res.status(404).json({ message: 'No blog posts found' });
    res.json(recentPosts);
  } catch (err) {
    console.error('Error fetching recent blog posts:', err);
    res.status(500).json({ message: err.message });
  }
});


router.get('/others', async (req, res) => {
  try {
    // Get the 4 most recent posts
    const recentPosts = await BlogPost.find()
      .sort({ date: -1 })
      .limit(3);

    const recentPostIds = recentPosts.map(post => post._id);

    // Find all posts except the recent ones
    const otherPosts = await BlogPost.find({ _id: { $nin: recentPostIds } })
      .sort({ date: -1 })
      .populate('tags');

    if (otherPosts.length === 0) {
      return res.status(404).json({ message: 'No additional blog posts found' });
    }

    res.json(otherPosts);
  } catch (err) {
    console.error('Error fetching other blog posts:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single blog post by ID
router.get('/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).populate('tags');
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    
    // Fetch comments for this blog post
    const comments = await Comment.find({ post: req.params.id });
    
    // Add comments to the blogPost object
    const blogPostWithComments = blogPost.toObject();
    blogPostWithComments.comments = comments;
    
    res.json(blogPostWithComments);
  } catch (err) {
    console.error('Error fetching blog post:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  const updatedData = {
    title: req.body.title,
    author: req.body.author,
    date: req.body.date,
    description: req.body.description,
    tags: req.body.tags ? req.body.tags.split(',') : [],
  };

  if (req.file) {
    updatedData.image = `/${req.file.filename}`;
    console.log('Updated image URL:', updatedData.image);
  }

  try {
    const blogPost = await BlogPost.findByIdAndUpdate(req.params.id, updatedData, { new: true }).populate('tags');
    if (!blogPost) return res.status(404).json({ message: 'Blog post not found' });
    console.log('Updated blog post:', blogPost);
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
