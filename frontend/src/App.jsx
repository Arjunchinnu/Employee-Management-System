import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import AdminLayout from "./layouts/AdminLayout";

// Admin pages
import AdminLogin from "./pages/Login";
import AdminDashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import LeaveRequests from "./pages/LeaveRequests";

// Employee pages remain separate from the admin sidebar.
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Protect admin pages.
function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  if (!token || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Protect employee pages.
function EmployeeRoute({ children }) {
  const token = localStorage.getItem("employeeToken");
  const role = localStorage.getItem("employeeRole");

  if (!token || role !== "employee") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Employee login */}
        <Route path="/" element={<EmployeeLogin />} />

        {/* Employee dashboard — separate from admin layout */}
        <Route
          path="/employee/dashboard"
          element={
            <EmployeeRoute>
              <EmployeeDashboard />
            </EmployeeRoute>
          }
        />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin layout and sidebar */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* Default admin page */}
          <Route
            index
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* Admin sidebar pages */}
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="employees" element={<Employees />} />

          <Route
            path="attendance"
            element={<div>Attendance Management</div>}
          />

          {/* Leave Requests page */}
          <Route path="leaves" element={<LeaveRequests />} />

          <Route path="settings" element={<div>Admin Settings</div>} />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}