import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use(
  (config) => {
    // Identify which session should authenticate this request.
    const url = config.url || "";
    const isEmployeeRequest = url.startsWith("/employee/");

    const token = isEmployeeRequest
      ? localStorage.getItem("employeeToken")
      : localStorage.getItem("adminToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
