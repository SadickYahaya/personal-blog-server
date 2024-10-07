const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { upload } = require('../helpers/imageUpload');
const Comment = require('../models/Comment'); 
const { sendNewsletterEmails } = require('../services/emailService');
const { postToTwitter } = require('../services/twitterService');
const { postToLinkedIn } = require('../services/linkedService');

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

    try {
      await sendNewsletterEmails(blogPost);
      console.log('Newsletter emails sent');
    } catch (error) {
      console.error('Error sending newsletter emails:', error);
    }
    
    try {
      await postToTwitter(blogPost);
      console.log('Posted to Twitter');
    } catch (error) {
      console.error('Error posting to Twitter:', error);
    }

    
    let linkedInPostStatus = 'Not attempted';
    try {
      await postToLinkedIn(blogPost);
      linkedInPostStatus = 'Success';
      console.log('Successfully posted to LinkedIn');
    } catch (error) {
      linkedInPostStatus = 'Failed';
      console.error('Error posting to LinkedIn:', error);
    }
    
    res.status(201).json({ ...blogPost.toObject(), linkedInPostStatus });
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