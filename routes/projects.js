const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Project = require('../models/Project');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use a timestamp to avoid name collisions
  }
});

const upload = multer({ storage });

// Create a new project
router.post('/', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); 
  console.log('Body:', req.body); 

  if (!req.file) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  try {
    // Normalize the image path to use forward slashes
    const imagePath = req.file.path.replace(/\\/g, '/');
    
    const project = new Project({
      title: req.body.title,
      description: req.body.description,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [], // Convert tags to an array
      image: imagePath
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error saving project:', err); 
    res.status(500).json({ message: err.message });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err); 
    res.status(500).json({ message: err.message });
  }
});

// Get a single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err); 
    res.status(500).json({ message: err.message });
  }
});

// Update a project by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('File:', req.file); 
  console.log('Body:', req.body); 

  const updatedData = {
    title: req.body.title,
    description: req.body.description,
    tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [] // Convert tags to an array
  };

  if (req.file) {
    updatedData.image = req.file.path.replace(/\\/g, '/');
  }

  try {
    const project = await Project.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
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
