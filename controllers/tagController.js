const Project = require('../models/Project');

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { tag, textColor, bgColor } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.tags.push({ tag, textColor, bgColor });
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tags for a project
exports.getTags = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.status(200).json(project.tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const { projectId, tagId } = req.params;
    const { tag, textColor, bgColor } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tagIndex = project.tags.findIndex(t => t._id.toString() === tagId);
    if (tagIndex === -1) return res.status(404).json({ message: 'Tag not found' });

    project.tags[tagIndex] = { tag, textColor, bgColor };
    await project.save();

    res.status(200).json(project.tags[tagIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    const { projectId, tagId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.tags = project.tags.filter(t => t._id.toString() !== tagId);
    await project.save();

    res.status(200).json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllTags = async (req, res) => {
    try {
      const projects = await Project.find({});
      const tags = projects.flatMap(project => project.tags);
  
      res.status(200).json(tags);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
