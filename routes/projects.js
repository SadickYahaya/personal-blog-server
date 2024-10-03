const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const upload = require('../helpers/imageUpload');

// Create a new project
router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Received file:', req.file);
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/projects/${req.file.filename}`;
      console.log('Image URL:', imageUrl);
    }

    const project = new Project({
      title: req.body.title,
      description: req.body.description,
      image: imageUrl,
      tags: req.body.tags ? req.body.tags?.split(',') : [],
    });

    await project.save();
    console.log('Saved project:', project);
    
    res.status(201).json(project);
  } catch (err) {
    console.error('Error saving project:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('tags');
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('tags');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update a project by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  const updatedData = {
    title: req.body.title,
    description: req.body.description,
    tags: req.body.tags ? req.body.tags?.split(',') : [],
  };

  if (req.file) {
    updatedData.image = `/uploads/projects/${req.file.filename}`;
    console.log('Updated image URL:', updatedData.image);
  }

  try {
    const project = await Project.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    console.log('Updated project:', project);
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a project by ID
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
