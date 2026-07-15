import { Link } from "react-router-dom";
import { Coffee, ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Coffee className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">WalletCo</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfa
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Son güncelleme: 26 Haziran 2025</p>
        <article className="mt-8 space-y-6 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-foreground [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
          {children}
        </article>
      </main>

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
        <p className="mt-4">© {new Date().getFullYear()} WalletCo</p>
      </footer>
    </div>
  );
}
