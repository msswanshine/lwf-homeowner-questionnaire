type ProgressBarProps = {
  /** 1-based step index for display */
  current: number;
  total: number;
  label: string;
};

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="w-full space-y-2" aria-label="Questionnaire progress">
      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <span>{label}</span>
        <span className="font-medium text-[var(--foreground)]">
          Step {current} of {total}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)] outline outline-1 outline-black/5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
