const Comment = require('../models/Comment');
const Complaint = require('../models/Complaint');

// @desc Add comment (Supports nested replies & internal notes)
// @route POST /api/complaints/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text, isInternal, parentCommentId } = req.body;
    const complaintId = req.params.id;

    // Normal users cannot create internal staff notes
    const isInternalNote = req.user.role !== 'user' && Boolean(isInternal);

    const comment = await Comment.create({
      complaintId,
      author: req.user._id,
      text,
      isInternal: isInternalNote,
      parentComment: parentCommentId || null
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name email role avatar');

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get comments for a complaint (filter out internal notes for regular users)
// @route GET /api/complaints/:id/comments
exports.getComments = async (req, res) => {
  try {
    const filter = { complaintId: req.params.id };
    
    // Regular users cannot see internal notes
    if (req.user.role === 'user') {
      filter.isInternal = false;
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name role avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};