import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3002",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});

// Dynamically attach accessToken from localStorage if present
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;   