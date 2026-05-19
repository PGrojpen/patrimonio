import { useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Início", subtitle: "Bem-vindo ao simulador" },
  "/simulador": { title: "Simulador de Aportes", subtitle: "Calcule o crescimento patrimonial com juros compostos" },
  "/backtest": { title: "Backtesting Histórico", subtitle: "Simule sua carteira no passado com dados reais" },
  "/monte-carlo": { title: "Simulação Monte Carlo", subtitle: "10.000 cenários para projetar seu futuro" },
  "/markowitz": { title: "Fronteira Eficiente", subtitle: "Otimização de carteira por Markowitz" },
  "/comparar": { title: "Comparar Cenários", subtitle: "Análise side-by-side de até 4 cenários" },
  "/aprenda": { title: "Aprenda", subtitle: "Conceitos de finanças e matemática por trás das métricas" },
};

export function Header() {
  const { pathname } = useLocation();
  const meta = PAGE_TITLES[pathname] ?? { title: "Patrimônio", subtitle: "" };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div>
        <h1 className="text-base font-semibold leading-none">{meta.title}</h1>
        {meta.subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 lg:hidden">
        <ThemeToggle />
      </div>
    </header>
  );
}
