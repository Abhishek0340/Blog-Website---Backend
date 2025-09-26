const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.Mixed,},
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  thumbnail: { type: String },
  images: [{ type: String }],
  keywords: { type: String },
  subtitle: { type: String },
  authorGmail: { type: String }
});

module.exports = mongoose.model('Post', postSchema);
