const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: { type: String, required: true },
  isInternal: { 
    type: Boolean, 
    default: false 
  }, // Internal notes visible ONLY to 'admin' and 'agent'
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // Enables 1-level or multi-level threaded discussions
  },
  attachments: [String]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);