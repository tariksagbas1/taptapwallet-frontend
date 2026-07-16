import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

const POSTER_W = 2100;
const POSTER_H = 2960;
const A6_MM_W = 105;
const A6_MM_H = 148;

const POSTER_BUCKET = "poster-backgrounds";
const DEFAULT_BACKGROUND_FILE = "default-background.png";
const PHONE_PROP_FILE = "Iphone-prop.png";

/** Fallback list if storage.list() is unavailable — exact filenames in the bucket. */
const FALLBACK_BACKGROUND_FILES = [
  "default-background.png",
  "2.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png",
  "11.png",
  "12.png",
  "13.png",
  "14.png",
  "15.png",
  "16.png",
  "17.png",
  "18.png",
];

function posterAssetUrl(filename: string): string {
  const { data } = supabase.storage.from(POSTER_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/** `default-background.png` → `default-background-small.png` */
function toSmallFilename(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return `${filename}-small`;
  return `${filename.slice(0, i)}-small${filename.slice(i)}`;
}

function isBackgroundFullFile(name: string): boolean {
  return (
    /\.(png|jpe?g|webp)$/i.test(name) &&
    !/^Iphone-prop/i.test(name) &&
    !/-small\./i.test(name)
  );
}

const DEFAULT_PRIMARY = "SADAKAT KARTINIZI\nŞİMDİ OLUŞTURUN";
const DEFAULT_SECONDARY = "10 KAHVE DAMGASI TOPLAYIN,\n1 KAHVE HEDİYE KAZANIN!";
const STATIC_INSTRUCTION = "Apple Cüzdanınıza eklemek için\nQR kodu okutun";

type FontSizeKey = "xs" | "sm" | "md" | "lg" | "xl";

const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string }[] = [
  { key: "xs", label: "Çok küçük" },
  { key: "sm", label: "Küçük" },
  { key: "md", label: "Orta" },
  { key: "lg", label: "Büyük" },
  { key: "xl", label: "Çok büyük" },
];

// Current hardcoded sizes map to "Büyük" (lg). Three steps smaller, one bigger.
const PRIMARY_FONT_SIZES: Record<FontSizeKey, number> = {
  xs: 100,
  sm: 120,
  md: 140,
  lg: 160,
  xl: 180,
};

const SECONDARY_FONT_SIZES: Record<FontSizeKey, number> = {
  xs: 50,
  sm: 60,
  md: 70,
  lg: 80,
  xl: 90,
};

interface BackgroundOption {
  id: string; // full-size filename, e.g. "2.png"
  fullSrc: string;
  thumbSrc: string; // `-small` variant for previews
  label: string;
}

function sortBackgroundFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const al = a.replace(/\.[^.]+$/, "");
    const bl = b.replace(/\.[^.]+$/, "");
    if (al === "default-background") return -1;
    if (bl === "default-background") return 1;
    const an = Number(al);
    const bn = Number(bl);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return al.localeCompare(bl);
  });
}

function toBackgroundOptions(filenames: string[]): BackgroundOption[] {
  return sortBackgroundFiles(filenames.filter(isBackgroundFullFile)).map((file) => ({
    id: file,
    fullSrc: posterAssetUrl(file),
    thumbSrc: posterAssetUrl(toSmallFilename(file)),
    label: file.replace(/\.[^.]+$/, ""),
  }));
}

export interface QrPosterLocationState {
  joinUrl: string;
  merchantName: string;
  merchantId: string;
  merchantSlug: string;
  programName: string;
  programSlug: string;
  logoUrl: string | null;
}

export default function QrPosterDesigner() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as QrPosterLocationState | null;
  const posterRef = useRef<HTMLDivElement>(null);
  const previewScale = useMemo(() => 420 / POSTER_W, []);

  const [primaryText, setPrimaryText] = useState(DEFAULT_PRIMARY);
  const [secondaryText, setSecondaryText] = useState(DEFAULT_SECONDARY);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  const [primaryFontSize, setPrimaryFontSize] = useState<FontSizeKey>("lg");
  const [secondaryFontSize, setSecondaryFontSize] = useState<FontSizeKey>("lg");
  const [instructionColor, setInstructionColor] = useState("#000000");
  const [backgroundFile, setBackgroundFile] = useState(DEFAULT_BACKGROUND_FILE);
  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>(() =>
    toBackgroundOptions(FALLBACK_BACKGROUND_FILES),
  );
  const [backgroundsLoading, setBackgroundsLoading] = useState(true);
  const [showLogo, setShowLogo] = useState(Boolean(state?.logoUrl));
  const [downloading, setDownloading] = useState(false);

  const joinUrl = state?.joinUrl ?? "";
  const logoUrl = state?.logoUrl ?? null;
  const logoVisible = showLogo && Boolean(logoUrl);
  const phonePropSrc = useMemo(() => posterAssetUrl(PHONE_PROP_FILE), []);

  const previewBackgroundSrc = useMemo(
    () => posterAssetUrl(toSmallFilename(backgroundFile)),
    [backgroundFile],
  );
  const fullBackgroundSrc = useMemo(() => posterAssetUrl(backgroundFile), [backgroundFile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBackgroundsLoading(true);
      try {
        const { data, error } = await supabase.storage.from(POSTER_BUCKET).list("", {
          limit: 200,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;

        const files = (data ?? []).map((f) => f.name).filter(isBackgroundFullFile);

        if (!cancelled && files.length > 0) {
          const options = toBackgroundOptions(files);
          setBackgroundOptions(options);
          setBackgroundFile((prev) => {
            if (options.some((o) => o.id === prev)) return prev;
            const def = options.find((o) => o.id === DEFAULT_BACKGROUND_FILE);
            return def?.id ?? options[0].id;
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          toast({
            title: "Arka planlar yüklenemedi",
            description: err?.message ?? "Varsayılan liste kullanılıyor.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setBackgroundsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sharedPosterProps = {
    joinUrl,
    phonePropSrc,
    primaryText,
    secondaryText,
    primaryColor,
    secondaryColor,
    primaryFontSize: PRIMARY_FONT_SIZES[primaryFontSize],
    secondaryFontSize: SECONDARY_FONT_SIZES[secondaryFontSize],
    instructionColor,
    showLogo: logoVisible,
    logoUrl,
  };

  if (!state?.joinUrl) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">Poster için bir program seçilmedi.</p>
        <Button asChild variant="outline">
          <Link to="/sales">Satış paneline dön</Link>
        </Button>
      </div>
    );
  }

  const downloadPdf = async () => {
    const el = posterRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      // Ensure the full-size background is loaded before capture (preview uses -small).
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = fullBackgroundSrc;
      });

      const canvas = await html2canvas(el, {
        width: POSTER_W,
        height: POSTER_H,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const img = canvas.toDataURL("image/png");
      const doc = new jsPDF({
        unit: "mm",
        format: [A6_MM_W, A6_MM_H],
        orientation: "portrait",
      });
      doc.addImage(img, "PNG", 0, 0, A6_MM_W, A6_MM_H);
      doc.save(`qr-poster-${state.merchantSlug}-${state.programSlug}.pdf`);
      toast({ title: "Poster indirildi" });
    } catch (err: any) {
      toast({
        title: "PDF oluşturulamadı",
        description: err?.message ?? "Bilinmeyen hata",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/sales")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Geri
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">QR Posteri Hazırla</h1>
          <p className="truncate text-sm text-muted-foreground">
            {state.merchantName} · {state.programName} · A6 (10,5 × 14,8 cm)
          </p>
        </div>
        <Button type="button" onClick={downloadPdf} disabled={downloading}>
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          PDF İndir
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
        {/* Controls */}
        <div className="order-2 space-y-5 lg:order-1">
          <div className="space-y-1.5">
            <Label>Birincil metin</Label>
            <Textarea
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="min-w-[7rem] flex-1" />
              <Select value={primaryFontSize} onValueChange={(v) => setPrimaryFontSize(v as FontSizeKey)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Yazı boyutu" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>İkincil metin</Label>
            <Textarea
              value={secondaryText}
              onChange={(e) => setSecondaryText(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="min-w-[7rem] flex-1" />
              <Select value={secondaryFontSize} onValueChange={(v) => setSecondaryFontSize(v as FontSizeKey)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Yazı boyutu" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>QR altı yazı rengi</Label>
            <p className="whitespace-pre-line text-xs text-muted-foreground">{STATIC_INSTRUCTION}</p>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={instructionColor}
                onChange={(e) => setInstructionColor(e.target.value)}
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input value={instructionColor} onChange={(e) => setInstructionColor(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <div className="text-sm font-medium">Logo göster</div>
              <div className="text-xs text-muted-foreground">
                {logoUrl ? "İşletme logosunu postere ekler." : "Bu işletmenin logo_url değeri yok."}
              </div>
            </div>
            <Switch checked={showLogo && Boolean(logoUrl)} onCheckedChange={setShowLogo} disabled={!logoUrl} />
          </div>

          <div className="space-y-2">
            <Label>Arka plan illüstrasyonu</Label>
            {backgroundsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {backgroundOptions.map((bg) => {
                const selected = backgroundFile === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackgroundFile(bg.id)}
                    className={`overflow-hidden rounded-md border-2 transition ${
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                    title={bg.label}
                  >
                    <img
                      src={bg.thumbSrc}
                      alt={bg.label}
                      className="aspect-[3/4] w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="order-1 lg:order-2">
          <div className="mb-2 text-center text-sm font-medium text-muted-foreground">Önizleme (A6)</div>
          <div
            className="mx-auto overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm"
            style={{ width: POSTER_W * previewScale, height: POSTER_H * previewScale }}
          >
            <div
              style={{
                width: POSTER_W,
                height: POSTER_H,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
              }}
            >
              <PosterCanvas {...sharedPosterProps} backgroundSrc={previewBackgroundSrc} />
            </div>
          </div>
        </div>
      </div>

      {/* Full-size poster kept off-screen for crisp PDF export (no CSS scale). */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: POSTER_W,
          height: POSTER_H,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <PosterCanvas ref={posterRef} {...sharedPosterProps} backgroundSrc={fullBackgroundSrc} />
      </div>

      <div className="h-16" />
    </div>
  );
}

const PosterCanvas = forwardRef<
  HTMLDivElement,
  {
    joinUrl: string;
    backgroundSrc: string;
    phonePropSrc: string;
    primaryText: string;
    secondaryText: string;
    primaryColor: string;
    secondaryColor: string;
    primaryFontSize: number;
    secondaryFontSize: number;
    instructionColor: string;
    showLogo: boolean;
    logoUrl: string | null;
  }
>(function PosterCanvas(
  {
    joinUrl,
    backgroundSrc,
    phonePropSrc,
    primaryText,
    secondaryText,
    primaryColor,
    secondaryColor,
    primaryFontSize,
    secondaryFontSize,
    instructionColor,
    showLogo,
    logoUrl,
  },
  ref,
) {
  // Proportions matched to the provided A6 example (2100×2960):
  // large 2-line primary, ~55% secondary, large gap to QR, phone overlapping QR bottom-right.
  const QR_SIZE = 1200;

  return (
    <div
      ref={ref}
      style={{
        width: POSTER_W,
        height: POSTER_H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <img
        src={backgroundSrc}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: showLogo && logoUrl ? 140 : 220,
          boxSizing: "border-box",
        }}
      >
        {showLogo && logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              width: 200,
              height: 200,
              objectFit: "contain",
              marginBottom: 36,
            }}
          />
        ) : null}

        {/* Primary — large, bold, 2-line block */}
        <div
          style={{
            marginTop: 100,
            color: primaryColor,
            fontSize: primaryFontSize,
            fontWeight: 800,
            lineHeight: 1.05,
            textAlign: "center",
            letterSpacing: "-0.01em",
            maxWidth: 1680,
            whiteSpace: "pre-line",
          }}
        >
          {primaryText}
        </div>

        {/* Secondary — ~55% of primary, tight under primary */}
        <div
          style={{
            color: secondaryColor,
            fontSize: secondaryFontSize,
            fontWeight: 600,
            lineHeight: 1.2,
            textAlign: "center",
            letterSpacing: "0",
            maxWidth: 1800,
            whiteSpace: "pre-line",
            marginTop: 48,
          }}
        >
          {secondaryText}
        </div>

        {/* QR + overlapping phone — large gap above (like the example) */}
        <div
          style={{
            position: "relative",
            marginTop: 150,
            width: QR_SIZE,
            height: QR_SIZE,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: QR_SIZE,
              height: QR_SIZE,
              backgroundColor: "#ffffff",
              borderRadius: 50,
              boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            <QRCodeCanvas value={joinUrl} size={QR_SIZE - 120} level="M" includeMargin={false} />
          </div>

          {/* Phone overlaps the bottom-right corner of the QR */}
          <img
            src={phonePropSrc}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              right: -470,
              bottom: -280,
              width: 580,
              height: "auto",
              zIndex: 3,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Instruction under QR */}
        <div
          style={{
            marginTop: 48,
            color: instructionColor,
            fontSize: 65,
            fontWeight: 500,
            lineHeight: 1.3,
            textAlign: "center",
            whiteSpace: "pre-line",
            maxWidth: 1200,
          }}
        >
          {STATIC_INSTRUCTION}
        </div>
      </div>
    </div>
  );
});
