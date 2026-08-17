const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', authorize('admin', 'agent'), getDashboardAnalytics);

module.exports = router;
