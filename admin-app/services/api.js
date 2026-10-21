import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Use your computer's current Wi-Fi IPv4 address.
const API_URL = "http://172.20.10.3:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("adminToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
