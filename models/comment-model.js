//Create comment mongoose schema
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  userID: {
    type: String,
    required: true,
  },
  productID: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
