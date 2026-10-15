
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  Settings,
  LogOut,
  UserRoundCog,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Employees", path: "/admin/employees", icon: Users },
  { name: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
  { name: "Leave Requests", path: "/admin/leaves", icon: ClipboardList },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (!confirmed) return;

    // Remove admin authentication data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");

    // Redirect to admin login
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <UserRoundCog size={25} />
        </div>

        <div>
          <h4>WorkForce</h4>
          <span>Management System</span>
        </div>
      </div>

      <p className="sidebar-label">MAIN MENU</p>

      <nav className="sidebar-nav">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>Admin Account</span>
          </div>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

