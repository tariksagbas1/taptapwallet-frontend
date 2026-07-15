interface Row {
  name: string;
  value: number;
}

export function LocationBars({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Henüz şube etkinliği yok.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium">{r.name}</span>
            <span className="text-muted-foreground">{r.value.toLocaleString("tr-TR")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
