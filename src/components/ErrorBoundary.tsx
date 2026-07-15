import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { logAppError } from "@/lib/errorLogger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logAppError({
      message: error.message,
      stack: error.stack,
      severity: "fatal",
      context: { type: "react.errorBoundary", componentStack: info.componentStack },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="mb-2 text-lg font-semibold">Bir şeyler ters gitti</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            {this.state.message && (
              <pre className="mb-4 max-h-32 overflow-auto rounded bg-muted p-2 text-left text-xs text-muted-foreground">
                {this.state.message}
              </pre>
            )}
            <Button onClick={this.handleReload}>Sayfayı yenile</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
