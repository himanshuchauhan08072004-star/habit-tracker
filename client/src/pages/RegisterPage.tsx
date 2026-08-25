import { useState, FormEvent, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorBanner } from "../components/ErrorBanner";

// A curated list is friendlier than the full ~400-zone IANA database;
// the backend still validates via Intl, so this is a UX convenience only.
const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const detectedTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, timezone || detectedTimezone);
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
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-6">Streaks are tracked in your local timezone.</p>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
            <select
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="" disabled>
                {detectedTimezone ? `Detected: ${detectedTimezone}` : "Select a timezone"}
              </option>
              {detectedTimezone && !COMMON_TIMEZONES.includes(detectedTimezone) && (
                <option value={detectedTimezone}>{detectedTimezone}</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              This determines which calendar day your check-ins count for.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2 text-sm font-medium transition-colors"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-5 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
