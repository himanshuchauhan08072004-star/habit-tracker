import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("habit_tracker_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Pulls the { code, message } our backend always returns on failure. */
export function extractApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.error?.message;
    if (typeof message === "string") return message;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}
