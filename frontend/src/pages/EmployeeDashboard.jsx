import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  LogOut,
  Clock3,
  CalendarCheck,
  Timer,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import API from "../services/api";

function getTodayDate() {
  const now = new Date();

  // Use the employee's local date.
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Convert minutes into readable working hours.
function formatWorkingHours(minutes) {
  const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0));

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

// Calculate duration from check-in/check-out when needed.
function getWorkingMinutes(record) {
  // Prefer the value calculated by your backend.
  if (record.workingMinutes !== undefined && record.workingMinutes !== null) {
    return Math.max(0, Number(record.workingMinutes) || 0);
  }

  if (!record.checkIn) return 0;

  const checkIn = new Date(record.checkIn).getTime();

  // If the employee has not checked out, count time up to now.
  const checkOut = record.checkOut
    ? new Date(record.checkOut).getTime()
    : Date.now();

  if (Number.isNaN(checkIn) || Number.isNaN(checkOut) || checkOut < checkIn) {
    return 0;
  }

  return Math.floor((checkOut - checkIn) / 60000);
}

function getAttendanceStatus(record) {
  if (record.status?.toLowerCase() === "absent") {
    return "Absent";
  }

  if (record.status?.toLowerCase() === "leave") {
    return "Leave";
  }

  if (record.checkIn && record.checkOut) {
    return "Completed";
  }

  if (record.checkIn) {
    return "Working";
  }

  return record.status || "Not marked";
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem("employeeToken");

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      const response = await API.get("/employee/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(response.data.employee || response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("employeeToken");
        localStorage.removeItem("employeeRole");
        navigate("/", { replace: true });
        return;
      }

      setError(err.response?.data?.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // const loadAttendance = async () => {
  //   try {
  //     setAttendanceLoading(true);
  //     setAttendanceError("");

  //     const token = localStorage.getItem("employeeToken");

  //     if (!token) {
  //       navigate("/", { replace: true });
  //       return;
  //     }

  //     const response = await API.get("/attendance/me", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const data = response.data;

  //     // Support common response structures:
  //     // { attendance: [...] }, { records: [...] }, or [...]
  //     const records = Array.isArray(data)
  //       ? data
  //       : Array.isArray(data.attendance)
  //         ? data.attendance
  //         : Array.isArray(data.records)
  //           ? data.records
  //           : Array.isArray(data.data)
  //             ? data.data
  //             : [];

  //     // Sort newest attendance date first.
  //     records.sort((a, b) => {
  //       const dateA = new Date(a.date || a.checkIn || a.createdAt).getTime();
  //       const dateB = new Date(b.date || b.checkIn || b.createdAt).getTime();

  //       return dateB - dateA;
  //     });

  //     setAttendance(records);
  //   } catch (err) {
  //     console.error(
  //       "Attendance error:",
  //       err.response?.data || err.message
  //     );

  //     setAttendanceError(
  //       err.response?.data?.message ||
  //         "Unable to load attendance records. Please try again."
  //     );
  //   } finally {
  //     setAttendanceLoading(false);
  //   }
  // };

  const loadAttendance = async () => {
    try {
      setAttendanceLoading(true);
      setAttendanceError("");

      const token = localStorage.getItem("employeeToken");

      if (!token) {
        navigate("/", { replace: true });
        return;
      }

      const response = await API.get("/attendance/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Attendance API response:", response.data);

      const records = response.data.attendance || [];

      setAttendance(records);
    } catch (err) {
      console.error("HTTP status:", err.response?.status);
      console.error("Backend error:", err.response?.data);

      setAttendanceError(
        err.response?.data?.message || "Unable to load attendance records.",
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadAttendance();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("employeeRole");

    navigate("/", { replace: true });
  };

  // Attendance for the current date.
  const today = getTodayDate();

  const todayAttendance = attendance.filter((record) => {
    if (record.date) {
      return String(record.date).slice(0, 10) === today;
    }

    if (record.checkIn) {
      return formatLocalDate(record.checkIn) === today;
    }

    return false;
  });

  // Sum recorded working minutes across all attendance records.
  const totalWorkingMinutes = attendance.reduce(
    (total, record) => total + getWorkingMinutes(record),
    0,
  );

  const todayWorkingMinutes = todayAttendance.reduce(
    (total, record) => total + getWorkingMinutes(record),
    0,
  );

  const attendedDays = new Set(
    attendance
      .filter((record) => record.checkIn)
      .map((record) => {
        if (record.date) {
          return String(record.date).slice(0, 10);
        }

        return formatLocalDate(record.checkIn);
      }),
  ).size;

  function formatLocalDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return (
    <main className="employee-dashboard-page">
      <header className="employee-dashboard-header">
        <div className="employee-dashboard-brand">
          <div className="employee-login-logo">
            <UserRound size={24} />
          </div>

          <div>
            <h2>Employee Portal</h2>
            <p>Employee Management System</p>
          </div>
        </div>

        <button className="btn btn-outline-success" onClick={handleLogout}>
          <LogOut size={16} className="me-2" />
          Logout
        </button>
      </header>

      <section className="employee-dashboard-welcome">
        <p className="eyebrow">MY WORKSPACE</p>

        <h1>Welcome{profile?.name ? `, ${profile.name}` : " back"}!</h1>

        <p>View your profile, attendance, and working hours.</p>
      </section>

      {loading && <p>Loading your profile...</p>}

      {error && <div className="alert alert-danger">{error}</div>}

      {profile && (
        <section className="employee-profile-card">
          <h2>My Profile</h2>

          <div className="employee-profile-grid">
            <div>
              <span>Full Name</span>
              <strong>{profile.name || "—"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{profile.email || "—"}</strong>
            </div>

            <div>
              <span>Employee ID</span>
              <strong>{profile.employeeId || "—"}</strong>
            </div>

            <div>
              <span>Department</span>
              <strong>{profile.department || "—"}</strong>
            </div>

            <div>
              <span>Designation</span>
              <strong>{profile.designation || "—"}</strong>
            </div>
          </div>
        </section>
      )}

      {/* WORKING HOURS SUMMARY */}
      <section className="employee-work-summary">
        <article className="work-summary-card">
          <div className="work-summary-icon">
            <Timer size={24} />
          </div>

          <div>
            <p>Total Working Hours</p>

            <h2>
              {attendanceLoading
                ? "..."
                : formatWorkingHours(totalWorkingMinutes)}
            </h2>

            <span>Across all recorded attendance</span>
          </div>
        </article>

        <article className="work-summary-card">
          <div className="work-summary-icon">
            <Clock3 size={24} />
          </div>

          <div>
            <p>Today's Working Hours</p>

            <h2>
              {attendanceLoading
                ? "..."
                : formatWorkingHours(todayWorkingMinutes)}
            </h2>

            <span>Based on today's attendance</span>
          </div>
        </article>

        <article className="work-summary-card">
          <div className="work-summary-icon">
            <CalendarCheck size={24} />
          </div>

          <div>
            <p>Days Attended</p>

            <h2>{attendanceLoading ? "..." : attendedDays}</h2>

            <span>Unique dates with check-in records</span>
          </div>
        </article>
      </section>

      {/* MY ATTENDANCE */}
      <section className="employee-attendance-card">
        <div className="employee-attendance-heading">
          <div>
            <h2>
              <CalendarCheck size={22} />
              My Attendance
            </h2>

            <p>View your complete attendance history.</p>
          </div>

          <button
            type="button"
            className="attendance-refresh-button"
            onClick={loadAttendance}
            disabled={attendanceLoading}
          >
            <RefreshCw
              size={16}
              className={attendanceLoading ? "refresh-spinning" : ""}
            />
            Refresh
          </button>
        </div>

        {attendanceError && (
          <div className="alert alert-danger">{attendanceError}</div>
        )}

        {attendanceLoading ? (
          <div className="attendance-empty-state">
            <RefreshCw size={28} className="refresh-spinning" />
            <p>Loading your attendance records...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="attendance-empty-state">
            <CalendarCheck size={34} />
            <h3>No attendance records yet</h3>
            <p>Your check-in and check-out records will appear here.</p>
          </div>
        ) : (
          <div className="employee-attendance-table-wrapper">
            <table className="employee-attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {attendance.map((record) => {
                  const status = getAttendanceStatus(record);

                  return (
                    <tr key={record._id || `${record.date}-${record.checkIn}`}>
                      <td className="attendance-date-cell">
                        {formatDate(record.date || record.checkIn)}
                      </td>

                      <td>{formatTime(record.checkIn)}</td>

                      <td>
                        {record.checkOut
                          ? formatTime(record.checkOut)
                          : "Not checked out"}
                      </td>

                      <td className="working-hours-cell">
                        {formatWorkingHours(getWorkingMinutes(record))}
                      </td>

                      <td>
                        <span
                          className={`employee-attendance-status status-${status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          <CheckCircle2 size={14} />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!attendanceLoading && attendance.length > 0 && (
          <div className="employee-attendance-footer">
            Showing {attendance.length} attendance record
            {attendance.length !== 1 ? "s" : ""}
          </div>
        )}
      </section>
    </main>
  );
}
