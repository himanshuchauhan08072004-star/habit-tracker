import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorBanner } from "../components/ErrorBanner";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Log in to your habit tracker.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2 text-sm font-medium transition-colors"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
