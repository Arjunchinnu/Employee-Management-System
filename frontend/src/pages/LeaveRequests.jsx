import { useEffect, useState } from "react";
import {
CalendarDays,
CheckCircle,
XCircle,
RefreshCw,
Clock,
User,
MessageSquare,
} from "lucide-react";

import API from "../services/api";

export default function LeaveRequests() {
const [leaves, setLeaves] = useState([]);
const [filter, setFilter] = useState("all");
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [comments, setComments] = useState({});
const [processingId, setProcessingId] = useState(null);

// Fetch leave requests
const fetchLeaves = async () => {
try {
setLoading(true);
setError("");


  const params = {};

  if (filter !== "all") {
    params.status = filter;
  }

  const response = await API.get("/admin/leaves", { params });

  const data = response.data;

  const leaveList = Array.isArray(data)
    ? data
    : Array.isArray(data.leaves)
      ? data.leaves
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.requests)
          ? data.requests
          : [];

  setLeaves(leaveList);
} catch (err) {
  console.error("Error fetching leave requests:", err);

  if (err.response?.status === 401 || err.response?.status === 403) {
    setError("Your admin session may have expired. Please log in again.");
  } else if (err.response?.status === 404) {
    setError(
      "Leave API not found. Please check whether the admin leave route is registered in your backend."
    );
  } else {
    setError(
      err.response?.data?.message ||
        "Failed to load leave requests. Please try again."
    );
  }

  setLeaves([]);
} finally {
  setLoading(false);
}


};

useEffect(() => {
fetchLeaves();
}, [filter]);

// Approve or reject a leave request
const reviewLeave = async (leaveId, status) => {
const action = status === "approved" ? "approve" : "reject";


const confirmed = window.confirm(
  `Are you sure you want to ${action} this leave request?`
);

if (!confirmed) return;

try {
  setProcessingId(leaveId);
  setError("");

  const response = await API.patch(
    `/admin/leaves/${leaveId}/review`,
    {
      status,
      adminComment: comments[leaveId] || "",
    }
  );

  window.alert(
    response.data.message || `Leave request ${status} successfully.`
  );

  await fetchLeaves();
} catch (err) {
  console.error("Error reviewing leave:", err);

  setError(
    err.response?.data?.message ||
      `Failed to ${action} the leave request.`
  );
} finally {
  setProcessingId(null);
}


};

// Format dates
const formatDate = (date) => {
if (!date) return "—";


const parsedDate = new Date(date);

if (Number.isNaN(parsedDate.getTime())) {
  return date;
}

return parsedDate.toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});


};

// Status badge styling
const getStatusClass = (status) => {
switch (status) {
case "approved":
return "bg-success-subtle text-success border border-success-subtle";


  case "rejected":
    return "bg-danger-subtle text-danger border border-danger-subtle";

  default:
    return "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
}


};

// Summary counts
const pendingCount = leaves.filter(
(leave) => leave.status === "pending"
).length;

const approvedCount = leaves.filter(
(leave) => leave.status === "approved"
).length;

const rejectedCount = leaves.filter(
(leave) => leave.status === "rejected"
).length;

return ( <main className="container-fluid py-4">
{/* Page Header */} <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"> <div> <p className="text-success  fw-semibold small mb-1">
WORKFORCE MANAGEMENT </p>

      <h2 className="fw-bold mb-1">Leave Requests</h2>

      <p className="text-muted mb-0">
        Manage and review employee leave applications.
      </p>
    </div>

    <button
      type="button"
      className="btn btn-success d-flex align-items-center gap-2"
      onClick={fetchLeaves}
      disabled={loading}
    >
      <RefreshCw size={16} />
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  </div>

  {/* Summary Cards */}
  <div className="row g-3 mb-4">
    <div className="col-12 col-sm-6 col-xl-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted mb-1">Pending Requests</p>
            <h3 className="fw-bold mb-0">{pendingCount}</h3>
          </div>

          <div className="rounded-circle bg-warning-subtle p-3">
            <Clock size={24} className="text-warning-emphasis" />
          </div>
        </div>
      </div>
    </div>

    <div className="col-12 col-sm-6 col-xl-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted mb-1">Approved Requests</p>
            <h3 className="fw-bold mb-0">{approvedCount}</h3>
          </div>

          <div className="rounded-circle bg-success-subtle p-3">
            <CheckCircle size={24} className="text-success" />
          </div>
        </div>
      </div>
    </div>

    <div className="col-12 col-sm-6 col-xl-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted mb-1">Rejected Requests</p>
            <h3 className="fw-bold mb-0">{rejectedCount}</h3>
          </div>

          <div className="rounded-circle bg-danger-subtle p-3">
            <XCircle size={24} className="text-danger" />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Filters */}
  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className="fw-semibold me-2">Filter:</span>

        {["all", "pending", "approved", "rejected"].map((status) => (
          <button
            type="button"
            key={status}
            onClick={() => setFilter(status)}
            className={`btn btn-sm ${
              filter === status
                ? "btn-primary"
                : "btn-success"
            }`}
            disabled={loading && filter === status}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* Error Message */}
  {error && (
    <div
      className="alert alert-danger d-flex justify-content-between align-items-center gap-3"
      role="alert"
    >
      <span>{error}</span>

      <button
        type="button"
        className="btn btn-sm btn-outline-danger flex-shrink-0"
        onClick={fetchLeaves}
        disabled={loading}
      >
        Retry
      </button>
    </div>
  )}

  {/* Leave Requests Table */}
  <section className="card border-0 shadow-sm">
    <div className="card-header bg-white py-3">
      <div className="d-flex align-items-center gap-2">
        <CalendarDays size={20} className="text-primary" />

        <h5 className="fw-bold mb-0">
          {filter === "all"
            ? "All Leave Requests"
            : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Leave Requests`}
        </h5>
      </div>
    </div>

    <div className="card-body p-0">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="text-muted mt-3 mb-0">
            Loading leave requests...
          </p>
        </div>
      ) : leaves.length === 0 ? (
        <div className="text-center py-5 px-3">
          <CalendarDays size={48} className="text-secondary mb-3" />

          <h5 className="fw-semibold">No leave requests found</h5>

          <p className="text-muted mb-0">
            Employee leave applications will appear here when submitted.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-3 py-3">Employee</th>
                <th className="py-3">Leave Type</th>
                <th className="py-3">Leave Dates</th>
                <th className="py-3">Reason</th>
                <th className="py-3">Status</th>
                <th className="py-3">Admin Comment</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  {/* Employee */}
                  <td className="px-3">
                    <div className="d-flex align-items-start gap-2">
                      <div className="rounded-circle bg-primary-subtle p-2">
                        <User size={18} className="text-primary" />
                      </div>

                      <div>
                        <div className="fw-semibold">
                          {leave.employee?.name || "Unknown Employee"}
                        </div>

                        <small className="text-muted">
                          {leave.employee?.employeeId ||
                            leave.employee?.email ||
                            "No employee ID"}
                        </small>
                      </div>
                    </div>
                  </td>

                  {/* Leave Type */}
                  <td>
                    <span className="badge bg-light text-dark border">
                      {leave.leaveType
                        ? leave.leaveType.charAt(0).toUpperCase() +
                          leave.leaveType.slice(1)
                        : "—"}
                    </span>
                  </td>

                  {/* Leave Dates */}
                  <td>
                    <div className="text-nowrap">
                      {formatDate(leave.startDate)}
                    </div>

                    <small className="text-muted text-nowrap">
                      to {formatDate(leave.endDate)}
                    </small>
                  </td>

                  {/* Reason */}
                  <td style={{ minWidth: "180px", maxWidth: "280px" }}>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {leave.reason || "No reason provided"}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`badge rounded-pill px-3 py-2 ${getStatusClass(
                        leave.status
                      )}`}
                    >
                      {leave.status || "pending"}
                    </span>
                  </td>

                  {/* Admin Comment */}
                  <td style={{ minWidth: "190px" }}>
                    {leave.status === "pending" ? (
                      <div>
                        <div className="d-flex align-items-center gap-1 mb-2 text-muted">
                          <MessageSquare size={14} />
                          <small>Optional comment</small>
                        </div>

                        <textarea
                          className="form-control form-control-sm"
                          rows="2"
                          maxLength={500}
                          placeholder="Add a comment..."
                          value={comments[leave._id] || ""}
                          onChange={(event) =>
                            setComments((previous) => ({
                              ...previous,
                              [leave._id]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-muted">
                        {leave.adminComment || "No comment"}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    {leave.status === "pending" ? (
                      <div className="d-flex flex-column gap-2">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={processingId !== null}
                          onClick={() =>
                            reviewLeave(leave._id, "approved")
                          }
                        >
                          <CheckCircle size={14} className="me-1" />

                          {processingId === leave._id
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={processingId !== null}
                          onClick={() =>
                            reviewLeave(leave._id, "rejected")
                          }
                        >
                          <XCircle size={14} className="me-1" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted small">
                        Already reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Footer */}
    {!loading && leaves.length > 0 && (
      <div className="card-footer bg-white text-muted small py-3">
        Showing {leaves.length} leave request
        {leaves.length !== 1 ? "s" : ""}.
      </div>
    )}
  </section>
</main>


);
}
