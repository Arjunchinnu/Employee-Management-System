import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, LogOut, Clock3, CalendarCheck } from "lucide-react";
import API from "../services/api";

export default function EmployeeDashboard() {
const navigate = useNavigate();
const [profile, setProfile] = useState(null);
const [error, setError] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {
const loadProfile = async () => {
try {
const response = await API.get("/employee/profile");
setProfile(response.data.employee || response.data);
} catch (err) {
if (err.response?.status === 401 || err.response?.status === 403) {
localStorage.removeItem("employeeToken");
localStorage.removeItem("employeeRole");
navigate("/", { replace: true });
return;
}


    setError(
      err.response?.data?.message || "Unable to load your profile."
    );
  } finally {
    setLoading(false);
  }
};

loadProfile();


}, [navigate]);

const handleLogout = () => {
localStorage.removeItem("employeeToken");
localStorage.removeItem("employeeRole");
navigate("/", { replace: true });
};

return ( <main className="employee-dashboard-page"> <header className="employee-dashboard-header"> <div className="employee-dashboard-brand"> <div className="employee-login-logo"> <UserRound size={24} /> </div> <div> <h2>Employee Portal</h2> <p>Employee Management System</p> </div> </div>


    <button className="btn btn-outline-success" onClick={handleLogout}>
      <LogOut size={16} className="me-2" />
      Logout
    </button>
  </header>

  <section className="employee-dashboard-welcome">
    <p className="eyebrow">MY WORKSPACE</p>
    <h1>
      Welcome{profile?.name ? `, ${profile.name}` : " back"}!
    </h1>
    <p>View your profile and keep track of your workday.</p>
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

  <section className="employee-dashboard-quick-links">
    <article>
      <CalendarCheck size={24} />
      <h3>My Attendance</h3>
      <p>Check your attendance records and workday status.</p>
    </article>

    <article>
      <Clock3 size={24} />
      <h3>Working Hours</h3>
      <p>Your attendance and working-hours features will appear here.</p>
    </article>
  </section>
</main>


);
}
