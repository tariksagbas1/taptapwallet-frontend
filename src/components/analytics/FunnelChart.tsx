export interface FunnelStep {
  label: string;
  count: number;
}

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.count ?? 0;
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        const pct = top === 0 ? 0 : (s.count / top) * 100;
        const conv = i === 0 || steps[i - 1].count === 0 ? null : (s.count / steps[i - 1].count) * 100;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {s.count.toLocaleString("tr-TR")}
                {conv !== null && <span className="ml-2 text-xs">({Math.round(conv)}%)</span>}
              </span>
            </div>
            <div className="h-8 overflow-hidden rounded-md bg-secondary">
              <div
                className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-primary/70 to-primary px-3 text-xs font-medium text-primary-foreground transition-all"
                style={{ width: `${Math.max(pct, 4)}%` }}
              >
                {pct > 12 && `${Math.round(pct)}%`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
