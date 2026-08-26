import { FormEvent, useState } from "react";
import { ErrorBanner } from "./ErrorBanner";

interface BackfillFormProps {
  minDate: string;
  maxDate: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (date: string) => void;
}

export function BackfillForm({ minDate, maxDate, submitting, error, onSubmit }: BackfillFormProps) {
  const [date, setDate] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    onSubmit(date);
    setDate("");
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">Missed a day?</h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        Keep your history accurate by adding a past check-in.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error && <ErrorBanner message={error} />}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="backfill-date" className="mb-1 block text-sm font-medium text-ink">
              Date
            </label>
            <input
              id="backfill-date"
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !date}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add check-in"}
          </button>
        </div>
        <p className="text-xs text-ink-faint">Only past local dates for this habit are allowed.</p>
      </form>
    </div>
  );
}
