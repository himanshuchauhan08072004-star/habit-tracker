import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

/**
 * Polished inline error surface. Always shows the server's own message
 * (see extractApiErrorMessage) — never a raw stack trace, and never
 * silently swallowed to a console.log.
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-bad-600/20 bg-bad-50 px-3.5 py-3 text-sm text-bad-600"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 rounded p-0.5 text-bad-600/70 hover:text-bad-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
