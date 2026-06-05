import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
function triggerLogout() {
  window.dispatchEvent(new Event("auth:logout"));
}
import { toast } from "sonner";
const BASE_URL = "http://localhost:3002";
const instance = axios.create({
  baseURL: BASE_URL,
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

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle expired token
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {

        const { data } = await axios.post(
          `${BASE_URL}/auth/refreshToken`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired. Please login again.");
        triggerLogout();
        navigate("/auth");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default instance;   