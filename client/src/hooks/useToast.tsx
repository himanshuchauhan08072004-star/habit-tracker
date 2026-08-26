import { useCallback, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Toast {
  id: number;
  title: string;
  description?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, description?: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const ToastViewport = useCallback(
    () => (
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 rounded-md border border-line bg-surface px-4 py-3 shadow-popover animate-fadeIn"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-good-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="text-xs text-ink-muted">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    ),
    [toasts]
  );

  return { showToast, ToastViewport };
}
