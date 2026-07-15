import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export default function StaffScan() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(true);

  const onScan = (codes: { rawValue: string }[]) => {
    if (!codes || codes.length === 0) return;
    const value = codes[0].rawValue ?? "";
    const match = value.match(UUID_RE);
    if (!match) {
      setError("Geçersiz QR kod");
      return;
    }
    setActive(false);
    navigate(`/staff/customer/${match[0]}`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="overflow-hidden">
        <div className="aspect-square w-full bg-black">
          {active && (
            <Scanner
              onScan={onScan}
              onError={(e) => setError(e instanceof Error ? e.message : "Kamera hatası")}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          )}
        </div>
        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
          <ScanLine className="h-4 w-4" />
          Müşterinin cüzdan kartındaki QR kodu okutun
        </div>
      </Card>
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => { setError(null); setActive(true); }}>
            Tekrar dene
          </Button>
        </div>
      )}
      <Button variant="outline" onClick={() => navigate("/staff/search")}>
        Telefonla ara
      </Button>
    </div>
  );
}
