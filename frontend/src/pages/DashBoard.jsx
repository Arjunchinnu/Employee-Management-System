import { useEffect, useState } from "react";
import API from "../services/api";

import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  ArrowUpRight,
  Clock3,
} from "lucide-react";

const statCards = [
  {
    title: "Total Employees",
    key: "totalEmployees",
    description: "All registered employees",
    icon: Users,
  },
  {
    title: "Present Today",
    key: "presentToday",
    description: "Checked in today",
    icon: UserCheck,
  },
  {
    title: "Absent Today",
    key: "absentToday",
    description: "Not yet checked in",
    icon: UserX,
  },
  {
    title: "Pending Leaves",
    key: "pendingLeaves",
    description: "Awaiting approval",
    icon: CalendarDays,
  },
];

// Get today's date in Indian Standard Time.
function getIndianDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = {};

  parts.forEach(({ type, value }) => {
    dateParts[type] = value;
  });

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

// Extract arrays from different API response formats.
function extractArray(data, possibleKeys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
}

// Get the employee ID used to identify an employee in attendance.
function getEmployeeId(record) {
  const employee = record.employee ?? record.employeeId;

  if (employee && typeof employee === "object") {
    return employee._id ?? employee.id ?? null;
  }

  return employee ?? null;
}

// Check whether the attendance record has a check-in time.
function hasCheckedIn(record) {
  return Boolean(record.checkIn ?? record.checkInTime);
}

// Extract employee details from the actual attendance response.
function getEmployeeDetails(record) {
  const employee =
    record.employee && typeof record.employee === "object"
      ? record.employee
      : record.employeeId && typeof record.employeeId === "object"
        ? record.employeeId
        : {};

  return {
    employeeId:
      employee.employeeId ??
      record.employeeCode ??
      (typeof record.employeeId === "string" ? record.employeeId : "N/A"),

    name: employee.name ?? record.name ?? "N/A",

    department: employee.department ?? record.department ?? "N/A",
  };
}

// Convert UTC timestamps into Indian Standard Time.
function formatAttendanceTime(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
  });

  const [recentAttendance, setRecentAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const today = getIndianDate();

        // Fetch employees, attendance, and pending leaves.
        const results = await Promise.allSettled([
          API.get("/admin/employees"),

          API.get("/admin/attendance", {
            params: { date: today },
          }),

          API.get("/admin/leaves", {
            params: { status: "pending" },
          }),
        ]);

        if (cancelled) return;

        const [employeesResult, attendanceResult, leavesResult] = results;

        // ----------------------------------------
        // TOTAL EMPLOYEES
        // ----------------------------------------

        let employees = [];

        if (employeesResult.status === "fulfilled") {
          const responseData = employeesResult.value.data;

          employees = extractArray(responseData, [
            "employees",
            "data",
            "results",
          ]);

          console.log("All Employees API Response:", responseData);
          console.log("Total Registered Employees:", employees.length);
        } else {
          console.error(
            "Error fetching employees:",
            employeesResult.reason?.response?.data ||
              employeesResult.reason?.message,
          );
        }

        // ----------------------------------------
        // TODAY'S ATTENDANCE
        // ----------------------------------------

        let attendance = [];

        if (attendanceResult.status === "fulfilled") {
          const responseData = attendanceResult.value.data;

          // Your API returns:
          // { success: true, date: "...", count: 1, attendance: [...] }

          attendance = extractArray(responseData, [
            "attendance",
            "records",
            "data",
            "results",
          ]);

          setRecentAttendance(attendance);

          console.log("Attendance API Response:", responseData);
          console.log("Attendance Records:", attendance);
        } else {
          console.error(
            "Error fetching attendance:",
            attendanceResult.reason?.response?.data ||
              attendanceResult.reason?.message,
          );

          setRecentAttendance([]);
        }

        // ----------------------------------------
        // PENDING LEAVE REQUESTS
        // ----------------------------------------

        let leaves = [];

        if (leavesResult.status === "fulfilled") {
          const responseData = leavesResult.value.data;

          leaves = extractArray(responseData, [
            "leaves",
            "requests",
            "data",
            "results",
          ]);

          console.log("Leaves API Response:", responseData);
        } else {
          console.error(
            "Error fetching leaves:",
            leavesResult.reason?.response?.data || leavesResult.reason?.message,
          );
        }

        // ----------------------------------------
        // CALCULATE PRESENT EMPLOYEES
        // ----------------------------------------

        const presentEmployeeIds = new Set();

        attendance.forEach((record) => {
          if (!hasCheckedIn(record)) {
            return;
          }

          const employeeId = getEmployeeId(record);

          if (employeeId) {
            presentEmployeeIds.add(String(employeeId));
          }
        });

        // ----------------------------------------
        // CALCULATE PENDING LEAVES
        // ----------------------------------------

        const pendingLeaves = leaves.filter(
          (leave) => String(leave.status || "").toLowerCase() === "pending",
        ).length;

        // ----------------------------------------
        // UPDATE DASHBOARD STATISTICS
        // ----------------------------------------

        const totalEmployees = employees.length;

        const presentToday = Math.min(totalEmployees, presentEmployeeIds.size);

        const absentToday = Math.max(0, totalEmployees - presentToday);

        if (!cancelled) {
          setStats({
            totalEmployees,
            presentToday,
            absentToday,
            pendingLeaves,
          });

          // Report failed requests without hiding successful data.
          const failedRequests = [];

          if (employeesResult.status === "rejected") {
            failedRequests.push("employees");
          }

          if (attendanceResult.status === "rejected") {
            failedRequests.push("attendance");
          }

          if (leavesResult.status === "rejected") {
            failedRequests.push("leaves");
          }

          if (failedRequests.length > 0) {
            setError(
              `Unable to load ${failedRequests.join(
                ", ",
              )} data. Check your login and backend API routes.`,
            );
          }
        }
      } catch (err) {
        console.error(
          "Error fetching dashboard data:",
          err.response?.status,
          err.response?.data || err.message,
        );

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data. Please check your backend and admin login.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Today's date in Indian Standard Time.
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="dashboard-page container-fluid">
      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKFORCE MANAGEMENT</p>

          <h1>Dashboard</h1>

          <p className="muted">Welcome back! Here's your workforce overview.</p>
        </div>

        <div className="today-badge">
          <Clock3 size={16} />
          <span>{todayLabel}</span>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* DASHBOARD STATISTICS */}
      <section className="stats-grid">
        {statCards.map(({ title, key, description, icon: Icon }) => (
          <article className="stat-card" key={title}>
            <div className="stat-top">
              <div className="stat-icon">
                <Icon size={21} />
              </div>

              <ArrowUpRight size={18} className="stat-arrow" />
            </div>

            <p className="stat-title">{title}</p>

            <h2>{loading ? "..." : stats[key]}</h2>

            <p className="muted">{description}</p>
          </article>
        ))}
      </section>

      {/* WELCOME SECTION */}
      <section className="welcome-card">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>

          <h2>Your team, all in one place.</h2>

          <p>
            Manage employees, monitor attendance, and review leave requests from
            one dashboard.
          </p>
        </div>

        <div className="welcome-illustration">
          <Users size={76} strokeWidth={1.2} />
        </div>
      </section>

      {/* RECENT ATTENDANCE ACTIVITY */}
      {/* <section className="content-card">
        <div className="section-heading">
          <div>
            <h2>Recent Activity</h2>

            <p className="muted">
              Employee attendance records for {todayLabel}
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Check-in Time</th>
                <th>Check-out Time</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading attendance records...
                  </td>
                </tr>
              ) : recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No attendance records found for today.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((record, index) => {
                  const employee = getEmployeeDetails(record);

                  return (
                    <tr key={record._id ?? index}>
                      <td>{employee.employeeId}</td>

                      <td>{employee.name}</td>

                      <td>{employee.department}</td>

                      <td>{formatAttendanceTime(record.checkIn)}</td>

                      <td>{formatAttendanceTime(record.checkOut)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section> */}

      {/* Recent Activity */}
      <section className="content-card recent-activity-card">
        <div className="recent-activity-header">
          <div>
            <p className="eyebrow">ATTENDANCE OVERVIEW</p>
            <h2>Recent Activity</h2>
            <p className="muted">
              Track employee check-in and check-out records.
            </p>
          </div>

          <div className="activity-date">
            <Clock3 size={17} />
            <span>{todayLabel}</span>
          </div>
        </div>

        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>CHECK-IN</th>
                <th>CHECK-OUT</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="activity-message">
                      <span className="activity-loader"></span>
                      <p>Loading attendance records...</p>
                    </div>
                  </td>
                </tr>
              ) : recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="activity-empty-state">
                      <div className="activity-empty-icon">
                        <Clock3 size={28} />
                      </div>

                      <h3>No attendance activity yet</h3>

                      <p>
                        Employee check-in and check-out records will appear here
                        once attendance is recorded.
                      </p>

                      <span className="empty-state-date">
                        Today's date: {todayLabel}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentAttendance.map((record, index) => {
                  const employee = getEmployeeDetails(record);

                  const checkedIn = Boolean(
                    record.checkIn ?? record.checkInTime,
                  );

                  const checkedOut = Boolean(
                    record.checkOut ?? record.checkOutTime,
                  );

                  const status = !checkedIn
                    ? "Not Checked In"
                    : checkedOut
                      ? "Completed"
                      : "Currently Working";

                  return (
                    <tr key={record._id ?? index}>
                      <td>
                        <div className="activity-employee">
                          <div className="activity-avatar">
                            {(employee.name || "E").charAt(0).toUpperCase()}
                          </div>

                          <div className="activity-employee-info">
                            <span className="activity-employee-name">
                              {employee.name}
                            </span>

                            <span className="activity-employee-subtitle">
                              Employee
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="employee-id-badge">
                          {employee.employeeId}
                        </span>
                      </td>

                      <td>
                        <span className="department-label">
                          {employee.department}
                        </span>
                      </td>

                      <td>
                        <div className="activity-time">
                          <Clock3 size={15} />
                          <span>
                            {formatAttendanceTime(
                              record.checkIn ?? record.checkInTime,
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="activity-time">
                          <Clock3 size={15} />
                          <span>
                            {formatAttendanceTime(
                              record.checkOut ?? record.checkOutTime,
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`attendance-status ${
                            !checkedIn
                              ? "status-absent"
                              : checkedOut
                                ? "status-completed"
                                : "status-working"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && recentAttendance.length > 0 && (
          <div className="activity-footer">
            <span>
              Showing <strong>{recentAttendance.length}</strong> attendance{" "}
              {recentAttendance.length === 1 ? "record" : "records"}
            </span>

            <span className="activity-footer-date">
              <CalendarDays size={15} />
              {todayLabel}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
