import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Mail } from "lucide-react";

export default function Onboarding() {
  const { user, merchant, isPlatformAdmin, isSales, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (merchant) return <Navigate to="/dashboard" replace />;
  if (isPlatformAdmin) return <Navigate to="/admin/merchants" replace />;
  if (isSales) return <Navigate to="/sales" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-warm)] p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Coffee className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Sadakat Cüzdanı</span>
        </div>
        <Card className="shadow-[var(--shadow-elevated)]">
          <CardHeader>
            <CardTitle>Hesabınız henüz bir işletmeye bağlı değil</CardTitle>
            <CardDescription>
              TapTapWallet paneli yalnızca davet ile açılır. Sizinle anlaştığımız e-posta adresine bir
              davet bağlantısı gönderildiyse oraya tıklayarak panele girebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="space-y-1">
                <div className="font-medium">{user.email}</div>
                <div className="text-muted-foreground">
                  Davet henüz gelmediyse lütfen bizimle iletişime geçin. TapTapWallet aboneliği uygulama
                  dışında düzenlenir.
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}>
              Çıkış yap
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
