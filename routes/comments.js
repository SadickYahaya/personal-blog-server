const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// Get all comments for a specific post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new comment
router.post('/', async (req, res) => {
  try {
    const { postId, name, content } = req.body;
    const newComment = new Comment({
      name,
      post: postId,
      content
    });
    const savedComment = await newComment.save();
    res.json(savedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a comment
router.put('/:id', async (req, res) => {
  try {
    const { name, content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    comment.name = name;
    comment.content = content;
    const updatedComment = await comment.save();
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
