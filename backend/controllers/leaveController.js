const Leave = require("../models/Leave");

const isValidDate = (value) => {
if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
return false;
}

const date = new Date(`${value}T00:00:00.000Z`);

return !Number.isNaN(date.getTime()) &&
date.toISOString().slice(0, 10) === value;
};

// EMPLOYEE: Apply for leave
exports.applyLeave = async (req, res) => {
try {
const { leaveType, startDate, endDate, reason } = req.body;


if (!leaveType || !startDate || !endDate || !reason?.trim()) {
  return res.status(400).json({
    success: false,
    message: "Leave type, dates, and reason are required."
  });
}

const allowedTypes = ["casual", "sick", "earned", "unpaid"];

if (!allowedTypes.includes(leaveType)) {
  return res.status(400).json({
    success: false,
    message: "Invalid leave type."
  });
}

if (!isValidDate(startDate) || !isValidDate(endDate)) {
  return res.status(400).json({
    success: false,
    message: "Dates must be valid and use YYYY-MM-DD format."
  });
}

if (endDate < startDate) {
  return res.status(400).json({
    success: false,
    message: "End date cannot be before start date."
  });
}

if (reason.trim().length > 500) {
  return res.status(400).json({
    success: false,
    message: "Reason cannot exceed 500 characters."
  });
}

// Prevent overlapping pending or approved leave requests.
const overlappingLeave = await Leave.findOne({
  employee: req.employee.id,
  status: { $in: ["pending", "approved"] },
  startDate: { $lte: endDate },
  endDate: { $gte: startDate }
});

if (overlappingLeave) {
  return res.status(409).json({
    success: false,
    message: "You already have a pending or approved leave request for these dates."
  });
}

const leave = await Leave.create({
  employee: req.employee.id,
  leaveType,
  startDate,
  endDate,
  reason: reason.trim()
});

return res.status(201).json({
  success: true,
  message: "Leave request submitted successfully.",
  leave
});


} catch (error) {
console.error("Apply leave failed:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to submit leave request."
});


}
};

// EMPLOYEE: View their own leave requests
exports.getMyLeaves = async (req, res) => {
try {
const leaves = await Leave.find({
employee: req.employee.id
})
.sort({ createdAt: -1 })
.lean();


return res.status(200).json({
  success: true,
  count: leaves.length,
  leaves
});


} catch (error) {
console.error("Get my leaves failed:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to fetch leave requests."
});


}
};

// ADMIN: View all employees' leave requests
exports.getAllLeaves = async (req, res) => {
try {
const { status, employeeId } = req.query;
const filter = {};


if (status) {
  const allowedStatuses = ["pending", "approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid leave status."
    });
  }

  filter.status = status;
}

if (employeeId) {
  if (!/^[a-fA-F0-9]{24}$/.test(employeeId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid employee ID."
    });
  }

  filter.employee = employeeId;
}

const leaves = await Leave.find(filter)
  .populate("employee", "employeeId name email department designation")
  .populate("reviewedBy", "name email")
  .sort({ createdAt: -1 })
  .lean();

return res.status(200).json({
  success: true,
  count: leaves.length,
  leaves
});


} catch (error) {
console.error("Get all leaves failed:", error.message);


return res.status(500).json({
  success: false,
  message: "Unable to fetch leave requests."
});


}
};

// ADMIN: Approve or reject a leave request
exports.reviewLeave = async (req, res) => {
try {
const { status, adminComment = "" } = req.body;


if (!["approved", "rejected"].includes(status)) {
  return res.status(400).json({
    success: false,
    message: "Status must be approved or rejected."
  });
}

if (typeof adminComment !== "string" || adminComment.length > 500) {
  return res.status(400).json({
    success: false,
    message: "Admin comment must be a string of at most 500 characters."
  });
}

const leave = await Leave.findById(req.params.id);

if (!leave) {
  return res.status(404).json({
    success: false,
    message: "Leave request not found."
  });
}

if (leave.status !== "pending") {
  return res.status(409).json({
    success: false,
    message: "This leave request has already been reviewed."
  });
}

leave.status = status;
leave.reviewedBy = req.admin.id;
leave.reviewedAt = new Date();
leave.adminComment = adminComment.trim();

await leave.save();

return res.status(200).json({
  success: true,
  message: `Leave request ${status} successfully.`,
  leave
});


} catch (error) {
console.error("Review leave failed:", error.message);


if (error.name === "CastError") {
  return res.status(400).json({
    success: false,
    message: "Invalid leave request ID."
  });
}

return res.status(500).json({
  success: false,
  message: "Unable to review leave request."
});


}
};
