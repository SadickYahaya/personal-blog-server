const express = require('express');
const router = express.Router();
const TagController = require('../controllers/tagController');

// Create a new tag
router.post('/projects/:projectId/tags', TagController.createTag);

// Get all tags for a project
router.get('/projects/:projectId/tags', TagController.getTags);

// Update a tag
router.put('/projects/:projectId/tags/:tagId', TagController.updateTag);

// Delete a tag
router.delete('/projects/:projectId/tags/:tagId', TagController.deleteTag);

router.get('/tags', TagController.getAllTags);

module.exports = router;
