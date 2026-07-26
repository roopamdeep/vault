import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create();

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken, setAccessToken } = useAuthStore.getState();

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post("/api/auth/refresh", { refreshToken });
        const newToken = res.data.accessToken;
        setAccessToken(newToken);
        original.headers["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
