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
    description: "Registered employees",
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get today's date in Indian time.
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

        const today = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;

        // Fetch data from backend APIs.
        const [employeesRes, attendanceRes, leavesRes] = await Promise.all([
          API.get("/employees"),
          API.get(`/admin/attendance?date=${today}`),
          API.get("/admin/leaves?status=pending"),
        ]);

        // Extract employee records.
        const employees = Array.isArray(employeesRes.data)
          ? employeesRes.data
          : employeesRes.data.employees || [];

        // Extract attendance records.
        const attendance = Array.isArray(attendanceRes.data)
          ? attendanceRes.data
          : attendanceRes.data.attendance || attendanceRes.data.records || [];

        // Extract pending leave records.
        const leaves = Array.isArray(leavesRes.data)
          ? leavesRes.data
          : leavesRes.data.leaves || leavesRes.data.requests || [];

        // Count unique employees who checked in today.
        const presentEmployeeIds = new Set(
          attendance
            .filter((record) => record.checkIn)
            .map((record) => {
              const employee = record.employee;

              if (employee && typeof employee === "object") {
                return employee._id || employee.id;
              }

              return employee || record.employeeId;
            })
            .filter(Boolean)
            .map(String),
        );

        // Update dashboard statistics.
        setStats({
          totalEmployees: employees.length,
          presentToday: presentEmployeeIds.size,
          absentToday: Math.max(0, employees.length - presentEmployeeIds.size),
          pendingLeaves: leaves.length,
        });
      } catch (error) {
        console.error(
          "Error fetching dashboard data:",
          error.response?.data || error.message,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <main className="dashboard-page container-fluid">
      {" "}
      <div className="page-heading">
        {" "}
        <div>
          {" "}
          <p className="eyebrow">WORKFORCE MANAGEMENT</p> <h1>Dashboard</h1>{" "}
          <p className="muted">
            Welcome back! Here's your workforce overview.{" "}
          </p>{" "}
        </div>
        <div className="today-badge">
          <Clock3 size={16} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
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
      <section className="content-card">
        <div className="section-heading">
          <h2>Recent Activity</h2>
          <p className="muted">Attendance activity will appear here.</p>s
        </div>

        <div className="empty-state">
          <Clock3 size={30} />
          <p>Connect the attendance API to display records.</p>
        </div>
      </section>
    </main>
  );
}
