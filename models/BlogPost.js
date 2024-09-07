const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  tag: { type: String, required: false },
  textColor: { type: String, required: false },
  bgColor: { type: String, required: false },
});

const BlogPostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  date: { type: String, required: true },
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [TagSchema], // Renamed from 'pins' to 'tags'
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);
