import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export function LoadingSpinner({ className, size = "md", label = "Carregando..." }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeMap[size]
        )}
        role="status"
        aria-label={label}
      />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
