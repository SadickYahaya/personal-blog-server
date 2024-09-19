const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

// Create a new tag
router.post('/', async (req, res) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();
    res.status(201).json(tag);
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all tags
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a tag by ID
router.put('/:id', async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json(tag);
  } catch (err) {
    console.error('Error updating tag:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a tag by ID
router.delete('/:id', async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    res.json({ message: 'Tag deleted' });
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
