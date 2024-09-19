const mongoose = require('mongoose');
const Tag = require('./Tag'); // Import the Tag model

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // Reference to Tag
  image: { type: String, required: true },
});

module.exports = mongoose.model('Project', ProjectSchema);
