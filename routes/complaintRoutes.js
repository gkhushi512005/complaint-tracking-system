const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
  assignComplaint
} = require('../controllers/complaintController');
const {
  addComment,
  getComments
} = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all complaint routes
router.use(protect);

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.patch('/:id/status', authorize('admin', 'agent'), updateComplaintStatus);
router.patch('/:id/assign', authorize('admin'), assignComplaint);

router.route('/:id/comments')
  .post(addComment)
  .get(getComments);

module.exports = router;
