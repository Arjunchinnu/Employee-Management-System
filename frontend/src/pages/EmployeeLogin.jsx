import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
UserRound,
LockKeyhole,
Eye,
EyeOff,
ShieldCheck,
} from "lucide-react";

import API from "../services/api";

export default function EmployeeLogin() {
const navigate = useNavigate();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async (event) => {
event.preventDefault();


setLoading(true);
setError("");

try {
  const response = await API.post("/employee/auth/login", {
    email,
    password,
  });

  const token = response.data.token;

  if (!token) {
    throw new Error("Authentication token was not returned by the server.");
  }

  // Keep employee and admin sessions separate.
  localStorage.setItem("employeeToken", token);
  localStorage.setItem("employeeRole", "employee");

  navigate("/employee/dashboard", { replace: true });
} catch (err) {
  setError(
    err.response?.data?.message ||
      err.message ||
      "Login failed. Please check your credentials."
  );
} finally {
  setLoading(false);
}


};

return ( <main className="employee-login-page"> <section className="employee-login-card"> <div className="employee-login-logo"> <UserRound size={28} /> </div>


    <p className="eyebrow">EMPLOYEE PORTAL</p>

    <h1>Welcome back!</h1>

    <p className="employee-login-description">
      Sign in to view your attendance, working hours, and leave requests.
    </p>

    {error && (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit}>
      <label htmlFor="employee-email">
        Email address
      </label>

      <div className="employee-login-input">
        <UserRound size={18} />

        <input
          id="employee-email"
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <label htmlFor="employee-password">
        Password
      </label>

      <div className="employee-login-input">
        <LockKeyhole size={18} />

        <input
          id="employee-password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="button"
          className="employee-password-toggle"
          onClick={() => setShowPassword((previous) => !previous)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <button
        type="submit"
        className="employee-login-submit"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>

    <div className="employee-login-security">
      <ShieldCheck size={16} />
      Secure Employee Access
    </div>
  </section>

  <p className="employee-login-copyright">
    Employee Management System
  </p>
</main>


);
}
