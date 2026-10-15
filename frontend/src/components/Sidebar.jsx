import { NavLink } from "react-router-dom";
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
          className="logout-button"
          onClick={() => alert("Logout functionality will be added later.")}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}