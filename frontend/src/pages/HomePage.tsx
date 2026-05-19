import { Link } from "react-router-dom";
import {
  BarChart3,
  GitCompare,
  LineChart,
  ScatterChart,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMarketRates } from "@/hooks/useSimulation";
import { formatNumber } from "@/lib/formatters";
import { MetricCard } from "@/components/ui/MetricCard";

const FEATURES = [
  {
    to: "/simulador",
    icon: TrendingUp,
    title: "Simulador de Aportes",
    description: "Calcule quanto seu patrimônio crescerá com aportes mensais e juros compostos. Suporte a aumentos anuais e inflação real.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    to: "/backtest",
    icon: BarChart3,
    title: "Backtesting Histórico",
    description: "Simule sua carteira multi-ativo nos últimos 10 anos com dados reais de mercado, rebalanceamento e impostos brasileiros.",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    to: "/monte-carlo",
    icon: LineChart,
    title: "Monte Carlo",
    description: "10.000 simulações por Geometric Brownian Motion ou Bootstrap. Visualize percentis e probabilidade de atingir sua meta.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    to: "/markowitz",
    icon: ScatterChart,
    title: "Fronteira Eficiente",
    description: "Otimização de carteira por Markowitz. Descubra a alocação de máximo Sharpe ou mínima variância para seu perfil.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    to: "/comparar",
    icon: GitCompare,
    title: "Comparar Cenários",
    description: "Salve e compare até 4 cenários de investimento lado a lado para tomar a melhor decisão.",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

export function HomePage() {
  const { data: rates, isLoading } = useMarketRates();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-violet-50 p-8 dark:from-blue-950/30 dark:to-violet-950/30">
        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
          <Zap className="h-4 w-4" />
          Simulador de Investimentos de Longo Prazo
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Construa seu{" "}
          <span className="gradient-text">patrimônio</span>
          {" "}com inteligência
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Ferramentas profissionais para simular estratégias de investimento no mercado brasileiro.
          Monte Carlo, Markowitz, backtesting com dados reais, e tributação fiel à legislação.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/simulador"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <TrendingUp className="h-4 w-4" />
            Começar simulação
          </Link>
          <Link
            to="/aprenda"
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Aprender conceitos
          </Link>
        </div>
      </div>

      {/* Market rates */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Taxas Atuais (Banco Central)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Selic (a.a.)"
            value={isLoading ? "..." : `${formatNumber(rates?.selic_aa ?? 0, 2)}%`}
            sub="Taxa básica de juros"
          />
          <MetricCard
            label="CDI (a.a.)"
            value={isLoading ? "..." : `${formatNumber(rates?.cdi_aa ?? 0, 2)}%`}
            sub="Referência renda fixa"
          />
          <MetricCard
            label="Poupança (a.a.)"
            value={isLoading ? "..." : `${formatNumber(rates?.poupanca_aa ?? 0, 2)}%`}
            sub="70% da Selic"
          />
        </div>
      </div>

      {/* Feature grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Ferramentas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ to, icon: Icon, title, description, color }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Example scenario */}
      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Exemplo: Pedro, 26 anos
        </p>
        <p className="text-sm text-muted-foreground">
          Aporta R$500/mês por 30 anos em carteira diversificada (60% renda variável, 30% renda fixa, 10% FIIs).
          Com retorno estimado de 11% a.a., chegaria a{" "}
          <strong className="text-foreground">R$ 1,4M nominal</strong> ou{" "}
          <strong className="text-foreground">R$ 390K reais</strong> (descontando IPCA de 4,5% a.a.).
        </p>
        <Link
          to="/simulador"
          className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
        >
          Simule este cenário →
        </Link>
      </div>
    </div>
  );
}
