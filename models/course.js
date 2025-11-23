const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  enrolledUsers: {
    type: [String], // Array of user IDs or emails
    default: []
  }
});

module.exports = mongoose.model('Course', courseSchema);
