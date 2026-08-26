import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "amber" | "good" | "neutral";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-600",
  good: "bg-good-50 text-good-600",
  neutral: "bg-canvas text-ink-muted",
};

export function StatCard({ icon, label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${TONE_CLASSES[tone]}`}>
          {icon}
        </span>
        <span className="text-sm font-medium text-ink-muted">{label}</span>
      </div>
      <p className="mt-3 tabular-nums text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
