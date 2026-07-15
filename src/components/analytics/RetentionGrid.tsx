export interface CohortRow {
  weekLabel: string;
  size: number;
  d7: number; // 0..1
  d30: number; // 0..1
}

function cell(value: number) {
  // 0 -> bg-muted, 1 -> primary at full opacity
  const opacity = Math.max(0.08, Math.min(1, value));
  return (
    <div
      className="flex h-9 w-full items-center justify-center rounded-md text-xs font-medium"
      style={{
        background: `hsl(var(--primary) / ${opacity * 0.85})`,
        color: opacity > 0.45 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
      }}
    >
      {value > 0 ? `${Math.round(value * 100)}%` : "—"}
    </div>
  );
}

export function RetentionGrid({ rows }: { rows: CohortRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Yeterli veri yok.</p>;
  }
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[120px_60px_1fr_1fr] items-center gap-2 px-1 text-xs text-muted-foreground">
        <span>Hafta</span>
        <span className="text-right">Üye</span>
        <span className="text-center">D7</span>
        <span className="text-center">D30</span>
      </div>
      {rows.map((r) => (
        <div key={r.weekLabel} className="grid grid-cols-[120px_60px_1fr_1fr] items-center gap-2">
          <div className="truncate text-sm">{r.weekLabel}</div>
          <div className="text-right text-sm tabular-nums text-muted-foreground">{r.size}</div>
          {cell(r.d7)}
          {cell(r.d30)}
        </div>
      ))}
    </div>
  );
}
