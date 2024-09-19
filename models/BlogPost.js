const mongoose = require('mongoose');
const Tag = require('./Tag'); // Import the Tag model

const BlogPostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  date: { type: String, required: true },
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // Reference to Tag
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);
