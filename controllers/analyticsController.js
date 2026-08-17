const Complaint = require('../models/Complaint');

// @desc Get Analytics Dashboard Data (KPIs, Charts)
// @route GET /api/analytics/dashboard
// @access Private (Admin / Agent)
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // 1. KPI Summary Counts
    const totalComplaints = await Complaint.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS'] } });
    const resolvedComplaints = await Complaint.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } });
    
    // 2. Average Resolution Time (in hours)
    const avgResTimeData = await Complaint.aggregate([
      { $match: { 'resolutionDetails.resolutionTimeInHours': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgHours: { $avg: '$resolutionDetails.resolutionTimeInHours' } } }
    ]);
    const avgResolutionTime = avgResTimeData.length > 0 ? avgResTimeData[0].avgHours.toFixed(1) : 0;

    // 3. Category Breakdown (Pie Chart)
    const categoryDistribution = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count', _id: 0 } }
    ]);

    // 4. Monthly Ticket Volume & Resolution Trends (Line / Area Chart)
    const monthlyTrends = await Complaint.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSubmitted: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.month' }, '/', { $toString: '$_id.year' }
            ]
          },
          Submitted: '$totalSubmitted',
          Resolved: '$resolvedCount',
          _id: 0
        }
      }
    ]);

    // 5. Workload Distribution by Agent (Bar Chart)
    const agentWorkload = await Complaint.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          activeTickets: {
            $sum: { $cond: [{ $in: ['$status', ['UNDER_REVIEW', 'IN_PROGRESS']] }, 1, 0] }
          },
          resolvedTickets: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      {
        $project: {
          agentName: '$agent.name',
          active: '$activeTickets',
          resolved: '$resolvedTickets',
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          total: totalComplaints,
          open: openComplaints,
          resolved: resolvedComplaints,
          avgResolutionHours: avgResolutionTime,
          resolutionRate: totalComplaints ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0
        },
        categoryDistribution,
        monthlyTrends,
        agentWorkload
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};