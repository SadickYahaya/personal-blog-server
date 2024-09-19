const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  textColor: { type: String, required: true },
  bgColor: { type: String, required: true },
});

module.exports = mongoose.model('Tag', TagSchema);
