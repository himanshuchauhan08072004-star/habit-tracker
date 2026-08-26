import { Sprout } from "lucide-react";

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Sprout size={20} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">Your journey starts here</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-muted">
        Create your first habit and start building consistency, one local day at a time.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Create your first habit
      </button>
    </div>
  );
}
