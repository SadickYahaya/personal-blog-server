const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  textColor: { type: String, required: true },
  bgColor: { type: String, required: true },
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [TagSchema], // Renamed from 'pins' to 'tags'
  image: { type: String, required: true },
});

module.exports = mongoose.model('Project', ProjectSchema);
