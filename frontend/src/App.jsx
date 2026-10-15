import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import AdminLayout from "./layouts/AdminLayout";

import AdminLogin from "./pages/Login";
import AdminDashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";

import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Protect admin pages
function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  if (!token || role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Protect employee pages
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
        {/* Employee login is the normal homepage */}
        <Route path="/" element={<EmployeeLogin />} />

        {/* Employee pages */}
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

        {/* Admin pages */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="employees" element={<Employees />} />
        </Route>

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
