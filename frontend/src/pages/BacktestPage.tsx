import { useState } from "react";
import { useRunBacktest } from "@/hooks/useSimulation";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConceptTooltip } from "@/components/educational/ConceptTooltip";
import { formatBRL, formatBRLCompact, formatNumber } from "@/lib/formatters";
import type { BacktestRequest } from "@/types/api";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, RefreshCw } from "lucide-react";

const AVAILABLE_ASSETS = [
  { ticker: "BOVA11.SA", name: "Ibovespa (BOVA11)" },
  { ticker: "IVVB11.SA", name: "S&P 500 BRL (IVVB11)" },
  { ticker: "KNRI11.SA", name: "Kinea FII (KNRI11)" },
  { ticker: "MXRF11.SA", name: "Maxi Renda FII (MXRF11)" },
  { ticker: "PETR4.SA", name: "Petrobras (PETR4)" },
  { ticker: "VALE3.SA", name: "Vale (VALE3)" },
  { ticker: "ITUB4.SA", name: "Itaú (ITUB4)" },
];

const LINE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function BacktestPage() {
  const mutation = useRunBacktest();
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BOVA11.SA", "IVVB11.SA"]);
  const [weights, setWeights] = useState<Record<string, number>>({ "BOVA11.SA": 60, "IVVB11.SA": 40 });
  const [startDate, setStartDate] = useState("2015-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [rebalance, setRebalance] = useState<"never" | "monthly" | "quarterly" | "annually">("annually");

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1;

  const handleRun = () => {
    const req: BacktestRequest = {
      tickers: selectedTickers,
      weights_pct: selectedTickers.map((t) => weights[t] ?? 0),
      start_date: startDate,
      end_date: endDate,
      initial_investment: initialInvestment,
      monthly_contribution: monthlyContribution,
      rebalance_frequency: rebalance,
      reinvest_dividends: true,
      apply_taxes: false,
    };
    mutation.mutate(req);
  };

  const result = mutation.data;

  const chartData = result?.dates.map((d, i) => {
    const point: Record<string, number | string> = { date: d.slice(0, 7) };
    point["Carteira"] = result.portfolio_values[i] ?? 0;
    point["Carteira Real"] = result.real_portfolio_values[i] ?? 0;
    result.benchmarks.forEach((b) => {
      point[b.name] = b.series[i] ?? 0;
    });
    return point;
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Config panel */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Configuração
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Ativos</label>
              {AVAILABLE_ASSETS.map(({ ticker, name }) => (
                <label key={ticker} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTickers.includes(ticker)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTickers((prev) => [...prev, ticker]);
                        setWeights((prev) => ({ ...prev, [ticker]: 0 }));
                      } else {
                        setSelectedTickers((prev) => prev.filter((t) => t !== ticker));
                        setWeights((prev) => { const next = { ...prev }; delete next[ticker]; return next; });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>

            {selectedTickers.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Pesos (%) — total: <span className={isWeightValid ? "text-emerald-600" : "text-red-500"}>{totalWeight.toFixed(1)}%</span>
                </label>
                {selectedTickers.map((ticker) => (
                  <div key={ticker} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 truncate">{ticker}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={weights[ticker] ?? 0}
                      onChange={(e) => setWeights((prev) => ({ ...prev, [ticker]: Number(e.target.value) }))}
                      className="input-field flex-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {[
              { label: "Data início", type: "date", value: startDate, onChange: (v: string) => setStartDate(v) },
              { label: "Data fim", type: "date", value: endDate, onChange: (v: string) => setEndDate(v) },
            ].map(({ label, type, value, onChange }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{label}</label>
                <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Aporte inicial (R$)</label>
                <input type="number" min={0} step={1000} value={initialInvestment} onChange={(e) => setInitialInvestment(Number(e.target.value))} className="input-field" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Aporte mensal (R$)</label>
                <input type="number" min={0} step={100} value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="input-field" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Rebalanceamento</label>
              <select value={rebalance} onChange={(e) => setRebalance(e.target.value as typeof rebalance)} className="input-field">
                <option value="never">Nunca (buy & hold)</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="annually">Anual</option>
              </select>
            </div>

            <button
              onClick={handleRun}
              disabled={mutation.isPending || !isWeightValid || selectedTickers.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity hover:opacity-90"
            >
              {mutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Executando...</> : "Executar Backtest"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4 lg:col-span-2">
          {mutation.isPending && <div className="flex h-64 items-center justify-center"><LoadingSpinner label="Buscando dados históricos..." /></div>}
          {mutation.isError && <ErrorMessage message={(mutation.error as Error).message} onRetry={() => mutation.reset()} />}

          {result && (
            <>
              {result.warning && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  ⚠️ {result.warning}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Valor Final" value={formatBRLCompact(result.final_value)} trend="up" />
                <MetricCard label="Retorno a.a." value={`${formatNumber(result.annualized_return_pct, 2)}%`} trend={result.annualized_return_pct > 0 ? "up" : "down"} />
                <MetricCard label="Max Drawdown" value={`${formatNumber(result.max_drawdown_pct, 2)}%`} trend="down" />
                <MetricCard label="Sharpe Ratio" value={formatNumber(result.sharpe_ratio, 2)} sub="Risco-retorno" trend={result.sharpe_ratio > 1 ? "up" : "neutral"} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Volatilidade a.a." value={`${formatNumber(result.volatility_pct, 2)}%`} />
                <MetricCard label="Sortino Ratio" value={formatNumber(result.sortino_ratio, 2)} sub="Downside risk" />
                <MetricCard label="Retorno Real a.a." value={`${formatNumber(result.real_annualized_return_pct, 2)}%`} sub="Descontado IPCA" trend={result.real_annualized_return_pct > 0 ? "up" : "down"} />
              </div>

              {/* Portfolio evolution chart */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4">Evolução Patrimonial vs Benchmarks</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v: number) => formatBRLCompact(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number, n: string) => [formatBRLCompact(v), n]} contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {["Carteira", ...result.benchmarks.map((b) => b.name)].map((name, idx) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[idx % LINE_COLORS.length]} strokeWidth={name === "Carteira" ? 2.5 : 1.5} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Drawdown */}
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Drawdown (Underwater Chart) <ConceptTooltip concept="drawdown" />
                </h3>
                <DrawdownChart dates={result.dates} values={result.portfolio_values} />
              </div>
            </>
          )}

          {!result && !mutation.isPending && !mutation.isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecione ativos e execute o backtest</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
