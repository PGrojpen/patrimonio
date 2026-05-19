import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, sub, trend, icon, className }: MetricCardProps) {
  return (
    <div className={cn("metric-card", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          trend === "up" && "text-emerald-600 dark:text-emerald-400",
          trend === "down" && "text-rose-600 dark:text-rose-400"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
