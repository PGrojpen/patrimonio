import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="font-medium text-destructive">Erro ao carregar dados</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
