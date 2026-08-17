const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// Generate Unique Ticket ID: TICK-YYYYMMDD-XXXX
const generateTicketId = async () => {
  const count = await Complaint.countDocuments();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `TICK-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
};

// @desc Create new complaint
// @route POST /api/complaints
// @access Private (User/Admin)
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, attachments } = req.body;
    const ticketId = await generateTicketId();

    const complaint = await Complaint.create({
      ticketId,
      title,
      description,
      category,
      priority,
      attachments: attachments || [],
      submittedBy: req.user._id,
      timeline: [{
        status: 'OPEN',
        updatedBy: req.user._id,
        note: 'Ticket created and registered in the system.'
      }]
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all complaints (with Search, Filter, Pagination, RBAC scoping)
// @route GET /api/complaints
// @access Private
exports.getComplaints = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 10 } = req.query;
    let query = {};

    // RBAC: Users only see their own complaints; Admins/Agents see all
    if (req.user.role === 'user') {
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'agent') {
      // Agents see unassigned tickets or tickets assigned to them
      query.$or = [{ assignedTo: req.user._id }, { assignedTo: null }];
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('submittedBy', 'name email avatar')
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: complaints
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update complaint status & trigger notification
// @route PATCH /api/complaints/:id/status
// @access Private (Admin / Agent)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    complaint.timeline.push({
      status,
      updatedBy: req.user._id,
      note: note || `Status updated to ${status}`
    });

    // If resolving the complaint, calculate resolution time
    if (status === 'RESOLVED') {
      const resolvedAt = new Date();
      const createdTime = new Date(complaint.createdAt).getTime();
      const hoursTaken = Math.max(0.1, ((resolvedAt.getTime() - createdTime) / (1000 * 60 * 60))).toFixed(2);
      
      complaint.resolutionDetails = {
        summary: note || 'Issue resolved by support team',
        resolvedAt,
        resolutionTimeInHours: parseFloat(hoursTaken)
      };
    }

    await complaint.save();

    // Create In-App Notification for ticket creator
    await Notification.create({
      recipient: complaint.submittedBy,
      sender: req.user._id,
      complaintId: complaint._id,
      type: 'STATUS_CHANGE',
      message: `Your ticket ${complaint.ticketId} status changed to ${status}.`
    });

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Assign complaint to agent
// @route PATCH /api/complaints/:id/assign
// @access Private (Admin only)
exports.assignComplaint = async (req, res) => {
  try {
    const { agentId } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { 
        assignedTo: agentId, 
        status: 'UNDER_REVIEW',
        $push: {
          timeline: {
            status: 'UNDER_REVIEW',
            updatedBy: req.user._id,
            note: `Assigned to support agent.`
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'name email');

    // Notify the assigned agent
    await Notification.create({
      recipient: agentId,
      sender: req.user._id,
      complaintId: complaint._id,
      type: 'ASSIGNED',
      message: `You were assigned ticket ${complaint.ticketId}`
    });

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};