import {
Users,
UserCheck,
UserX,
CalendarDays,
ArrowUpRight,
Clock3,
} from "lucide-react";

const stats = [
{
title: "Total Employees",
value: "—",
description: "Registered employees",
icon: Users,
},
{
title: "Present Today",
value: "—",
description: "Checked in today",
icon: UserCheck,
},
{
title: "Absent Today",
value: "—",
description: "Not yet checked in",
icon: UserX,
},
{
title: "Pending Leaves",
value: "—",
description: "Awaiting approval",
icon: CalendarDays,
},
];

export default function Dashboard() {
return ( <main className="dashboard-page container-fluid"> <div className="page-heading"> <div> <p className="eyebrow">WORKFORCE MANAGEMENT</p> <h1>Dashboard</h1> <p className="muted">
Welcome back! Here's your workforce overview. </p> </div>

    <div className="today-badge">
      <Clock3 size={16} />
      <span>{new Date().toLocaleDateString()}</span>
    </div>
  </div>

  <section className="stats-grid">
    {stats.map(({ title, value, description, icon: Icon }) => (
      <article className="stat-card" key={title}>
        <div className="stat-top">
          <div className="stat-icon">
            <Icon size={21} />
          </div>
          <ArrowUpRight size={18} className="stat-arrow" />
        </div>

        <p className="stat-title">{title}</p>
        <h2>{value}</h2>
        <p className="muted">{description}</p>
      </article>
    ))}
  </section>

  <section className="welcome-card">
    <div>
      <p className="eyebrow">ADMINISTRATION</p>
      <h2>Your team, all in one place.</h2>
      <p>
        Manage employees, monitor attendance, and review leave
        requests from one dashboard.
      </p>
    </div>

    <div className="welcome-illustration">
      <Users size={76} strokeWidth={1.2} />
    </div>
  </section>

  <section className="content-card">
    <div className="section-heading">
      <h2>Recent Activity</h2>
      <p className="muted">
        Attendance activity will appear here.
      </p>
    </div>

    <div className="empty-state">
      <Clock3 size={30} />
      <p>Connect the attendance API to display records.</p>
    </div>
  </section>
</main>


);
}
