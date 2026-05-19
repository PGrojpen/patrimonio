import { NavLink } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  GitCompare,
  LineChart,
  ScatterChart,
  TrendingUp,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/simulador", label: "Simulador", icon: TrendingUp },
  { to: "/backtest", label: "Backtesting", icon: BarChart3 },
  { to: "/monte-carlo", label: "Monte Carlo", icon: LineChart },
  { to: "/markowitz", label: "Markowitz", icon: ScatterChart },
  { to: "/comparar", label: "Comparar", icon: GitCompare },
  { to: "/aprenda", label: "Aprenda", icon: BookOpen },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          P
        </div>
        <div>
          <p className="font-semibold text-sm">Patrimônio</p>
          <p className="text-xs text-muted-foreground">Simulador de Investimentos</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
