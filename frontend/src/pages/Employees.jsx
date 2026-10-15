import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";

import API from "../services/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    employeeId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    designation: "",
    joiningDate: "",
  };

  const [form, setForm] = useState(initialForm);

  // Fetch employees from the backend
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/employees");

      const data = response.data;

      setEmployees(
        Array.isArray(data)
          ? data
          : Array.isArray(data.employees)
            ? data.employees
            : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load employees. Please check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open form for creating a new employee
  const handleAdd = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(true);
  };

  // Open form for editing an existing employee
  const handleEdit = (employee) => {
    setEditingId(employee._id);

    setForm({
      employeeId: employee.employeeId || "",
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      phone: employee.phone || "",
      department: employee.department || "",
      designation: employee.designation || "",
      joiningDate: employee.joiningDate
        ? String(employee.joiningDate).slice(0, 10)
        : "",
    });

    setShowForm(true);
  };

  // Create or update an employee
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = { ...form };

      // Password is required when creating an employee,
      // but should not be changed during an ordinary edit.
      if (editingId && !payload.password.trim()) {
        delete payload.password;
      }

      if (editingId) {
        await API.put(`/employees/${editingId}`, payload);
      } else {
        await API.post("/employees", payload);
      }

      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);

      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save employee. Please check the submitted details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete an employee
  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await API.delete(`/employees/${employee._id}`);

      await fetchEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this employee."
      );
    }
  };

  // Search employees
  const filteredEmployees = employees.filter((employee) => {
    const query = search.toLowerCase();

    return [
      employee.name,
      employee.employeeId,
      employee.email,
      employee.department,
      employee.designation,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <main className="dashboard-page container-fluid">
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKFORCE MANAGEMENT</p>
          <h1>Employees</h1>
          <p className="muted">
            Manage employee records from one place.
          </p>
        </div>

        <button className="btn btn-success" onClick={handleAdd}>
          <Plus size={17} className="me-2" />
          Add Employee
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex justify-content-between align-items-center"
          role="alert"
        >
          <span>{error}</span>

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <Users size={21} />
            </div>
          </div>

          <p className="stat-title">Total Employees</p>
          <h2>{employees.length}</h2>
          <p className="muted">Registered employee records</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <div className="stat-icon">
              <Search size={21} />
            </div>
          </div>

          <p className="stat-title">Search Results</p>
          <h2>{filteredEmployees.length}</h2>
          <p className="muted">Employees matching your search</p>
        </article>
      </section>

      {/* Employees table */}
      <section className="content-card employee-table-card">
        <div className="employee-toolbar">
          <div>
            <h2 className="employee-section-title">All Employees</h2>
            <p className="muted">View and manage employee information.</p>
          </div>

          <div className="employee-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="btn btn-outline-success"
            onClick={fetchEmployees}
            title="Refresh employees"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="table employee-table align-middle">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Users size={30} />
                      <p>No employees found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>
                      <div className="employee-identity">
                        <div className="employee-avatar">
                          {(employee.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{employee.name}</strong>
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{employee.employeeId || "—"}</td>

                    <td>{employee.department || "—"}</td>

                    <td>{employee.designation || "—"}</td>

                    <td>
                      <span className="employee-status">
                        {employee.employmentStatus || "Active"}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          className="icon-action edit-action"
                          title="Edit employee"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="icon-action delete-action"
                          title="Delete employee"
                          onClick={() => handleDelete(employee)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add/Edit employee form */}
      {showForm && (
        <div
          className="employee-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="employee-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-form-title"
          >
            <div className="employee-modal-header">
              <div>
                <p className="eyebrow">
                  EMPLOYEE MANAGEMENT
                </p>

                <h2 id="employee-form-title">
                  {editingId ? "Edit Employee" : "Add New Employee"}
                </h2>
              </div>

              <button
                className="icon-action"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="employee-form-grid">
                <label>
                  Employee ID *
                  <input
                    className="form-control"
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Full Name *
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Email *
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    className="form-control"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Department *
                  <input
                    className="form-control"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Designation *
                  <input
                    className="form-control"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Joining Date
                  <input
                    className="form-control"
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  {editingId ? "New Password (optional)" : "Password *"}
                  <input
                    className="form-control"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required={!editingId}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="employee-form-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Employee"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}