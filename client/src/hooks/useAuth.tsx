import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, extractApiErrorMessage } from "../services/api";
import { User } from "../types";

const TOKEN_KEY = "habit_tracker_token";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, timezone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem(TOKEN_KEY, res.data.data.token);
      setUser(res.data.data.user);
    } catch (err) {
      throw new Error(extractApiErrorMessage(err));
    }
  }

  async function register(email: string, password: string, timezone: string) {
    try {
      const res = await api.post("/auth/register", { email, password, timezone });
      localStorage.setItem(TOKEN_KEY, res.data.data.token);
      setUser(res.data.data.user);
    } catch (err) {
      throw new Error(extractApiErrorMessage(err));
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
