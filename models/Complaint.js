const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  ticketId: { 
    type: String, 
    unique: true, 
    required: true, 
    index: true 
  }, // e.g. "TICK-2026-0042"
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Hardware', 'Software', 'Network', 'Billing', 'Facilities', 'Other'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  attachments: [{
    url: String,
    filename: String
  }],
  timeline: [timelineEventSchema],
  resolutionDetails: {
    summary: String,
    resolvedAt: Date,
    resolutionTimeInHours: Number // Calculated upon resolution
  }
}, { timestamps: true });

// Compound indexes for rapid dashboard search & filter queries
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ submittedBy: 1, status: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);