import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}walletco-logo.png`}
              alt="WalletCo"
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="font-semibold tracking-tight">WalletCo</span>
          </div>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild>
                <Link to="/dashboard">Panele Git</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Giriş Yap</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=signup">Ücretsiz Başla</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Türkiye için cüzdan-yerli sadakat
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight md:text-6xl">
            Müşterileriniz uygulama indirmeden sadakat kartınızı{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              cüzdanlarına
            </span>{" "}
            eklesin.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Damga kartları, ödüller ve kampanyalar — doğrudan Apple Wallet'a. Kafe, fırın ve tatlıcılar için
            tasarlandı.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Hemen Başla <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Giriş Yap</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: "QR ile katılım",
              desc: "Müşteri QR kodu okutur, 30 saniyede üye olur ve kart cüzdana eklenir.",
            },
            {
              icon: Smartphone,
              title: "Apple Wallet'ta yaşar",
              desc: "Uygulama indirmeye gerek yok. Damgalar, ödüller, kampanyalar push ile güncellenir.",
            },
            {
              icon: BarChart3,
              title: "Net ROI raporları",
              desc: "Üye sayısı, tekrar ziyaret, ödül kullanımı — şubelere göre canlı analitik.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/user-agreement" className="hover:text-foreground">
            Kullanıcı Sözleşmesi
          </Link>
          <Link to="/privacy-policy" className="hover:text-foreground">
            Gizlilik Politikası
          </Link>
          <Link to="/support" className="hover:text-foreground">
            Destek
          </Link>
        </div>
        <p className="mt-4">© {new Date().getFullYear()} WalletCo — Türkiye&apos;de tasarlandı</p>
      </footer>
    </div>
  );
};

export default Index;
