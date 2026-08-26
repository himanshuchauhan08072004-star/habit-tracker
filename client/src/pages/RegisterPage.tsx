import { useState, FormEvent, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ErrorBanner } from "../components/ErrorBanner";

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

function Logo() {
  return (
    <div className="mb-6 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 8.5L5 11.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-semibold text-ink tracking-tight">HabitFlow</span>
    </div>
  );
}

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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-card">
        <Logo />
        <h1 className="text-lg font-semibold text-ink">Create your account</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Streaks are tracked in your local timezone.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-faint">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="reg-timezone" className="mb-1 block text-sm font-medium text-ink">
              Timezone
            </label>
            <select
              id="reg-timezone"
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none"
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
            <p className="mt-1 text-xs text-ink-faint">
              This determines which calendar day your check-ins count for.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
