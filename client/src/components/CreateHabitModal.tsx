import { FormEvent, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ErrorBanner } from "./ErrorBanner";

interface CreateHabitModalProps {
  open: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

export function CreateHabitModal({ open, submitting, error, onClose, onSubmit }: CreateHabitModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      // Focus the first field when the dialog opens, for keyboard users.
      setTimeout(() => nameRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim());
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-habit-title"
        className="w-full max-w-sm rounded-lg bg-surface p-5 shadow-popover animate-fadeIn"
      >
        <div className="flex items-center justify-between">
          <h2 id="create-habit-title" className="text-base font-semibold text-ink">
            Create a new habit
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-ink-faint hover:bg-black/[0.04] hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && <ErrorBanner message={error} />}

          <div>
            <label htmlFor="habit-name" className="mb-1 block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="habit-name"
              ref={nameRef}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Read for 20 minutes"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="habit-description" className="mb-1 block text-sm font-medium text-ink">
              Description <span className="font-normal text-ink-faint">(optional)</span>
            </label>
            <input
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Build a daily reading habit"
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-muted hover:bg-black/[0.04]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-md bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create habit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
