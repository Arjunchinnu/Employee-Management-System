import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // const handleSubmit = async (event) => {
  //   event.preventDefault();

  //   setLoading(true);
  //   setError("");

  //   try {
  //     const response = await API.post("auth/admin/login", {
  //       email,
  //       password,
  //     });

  //     if (response) {
  //       console.log("Login response:", response.data);
  //     } else {
  //       console.error("No response received from the server.");
  //     }

  //     const token = response.data.token;

  //     if (!token) {
  //       throw new Error("The server did not return an authentication token.");
  //     }

  //     localStorage.setItem("adminToken", token);

  //     navigate("/", { replace: true });
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.message ||
  //         err.message ||
  //         "Login failed. Please check your credentials.",
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      console.log("Attempting admin login with email:", email);
      const response = await API.post("/admin/auth/login", {
        email,
        password,
      });

      const { token, admin } = response.data;

      if (!token || !admin) {
        throw new Error("Invalid response from server.");
      }

      // Save admin authentication details
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", admin.role || "admin");

      // Redirect admin directly to the dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.log("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {" "}
      <section className="login-brand-panel">
        {" "}
        <div className="login-brand">
          {" "}
          <div className="login-brand-icon">
            {" "}
            <ShieldCheck size={27} />{" "}
          </div>{" "}
          <span>WorkForce</span>{" "}
        </div>
        <div className="login-brand-content">
          <p className="eyebrow">WORKFORCE MANAGEMENT SYSTEM</p>
          <h1>Manage your team. Simplify your work.</h1>
          <p>
            Manage employee records, monitor attendance, and review leave
            requests from one secure workspace.
          </p>
        </div>
        <p className="login-footer-text">Employee Management System</p>
      </section>
      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-mobile-brand">
            <ShieldCheck size={30} />
            <span>WorkForce</span>
          </div>

          <p className="eyebrow">ADMIN PORTAL</p>
          <h2>Welcome back</h2>
          <p className="login-description">
            Sign in to access your administration dashboard.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="login-label" htmlFor="email">
              Email address
            </label>

            <div className="login-input-wrapper">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <label className="login-label" htmlFor="password">
              Password
            </label>

            <div className="login-input-wrapper">
              <LockKeyhole size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="login-security-note">
            <LockKeyhole size={14} />
            Authorized administrators only
          </p>
        </div>
      </section>
    </main>
  );
}
