import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EfficientFrontierChart } from "@/components/charts/EfficientFrontierChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConceptTooltip } from "@/components/educational/ConceptTooltip";
import { formatNumber } from "@/lib/formatters";
import type { MarkowitzRequest, MarkowitzResult } from "@/types/api";
import { ScatterChart, RefreshCw } from "lucide-react";

const AVAILABLE_ASSETS = [
  { ticker: "BOVA11.SA", name: "Ibovespa" },
  { ticker: "IVVB11.SA", name: "S&P 500 BRL" },
  { ticker: "KNRI11.SA", name: "Kinea FII" },
  { ticker: "MXRF11.SA", name: "Maxi Renda FII" },
  { ticker: "NASD11.SA", name: "Nasdaq 100" },
  { ticker: "PETR4.SA", name: "Petrobras" },
  { ticker: "VALE3.SA", name: "Vale" },
];

export function MarkowitzPage() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BOVA11.SA", "IVVB11.SA", "KNRI11.SA"]);
  const [startDate, setStartDate] = useState("2018-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rfRate, setRfRate] = useState(10.5);

  const mutation = useMutation({
    mutationFn: async (req: MarkowitzRequest): Promise<MarkowitzResult> => {
      const { data } = await api.post<MarkowitzResult>("/markowitz/", req);
      return data;
    },
  });

  const handleRun = () => {
    mutation.mutate({
      tickers: selectedTickers,
      start_date: startDate,
      end_date: endDate,
      risk_free_rate_annual_pct: rfRate,
      n_points: 100,
    });
  };

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Config */}
        <div className="rounded-xl border bg-card p-5 space-y-4 lg:col-span-1">
          <h2 className="font-semibold flex items-center gap-2">
            <ScatterChart className="h-4 w-4 text-primary" />
            Ativos <ConceptTooltip concept="markowitz" />
          </h2>

          <div className="space-y-2">
            {AVAILABLE_ASSETS.map(({ ticker, name }) => (
              <label key={ticker} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTickers.includes(ticker)}
                  onChange={(e) => {
                    setSelectedTickers((prev) =>
                      e.target.checked ? [...prev, ticker] : prev.filter((t) => t !== ticker)
                    );
                  }}
                  className="rounded"
                />
                <span className="flex-1">{name}</span>
                <span className="text-xs text-muted-foreground font-mono">{ticker}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Período início</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Período fim</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Taxa livre de risco a.a. (%) <ConceptTooltip concept="sharpe" />
            </label>
            <input type="number" min={0} max={50} step={0.1} value={rfRate} onChange={(e) => setRfRate(Number(e.target.value))} className="input-field" />
          </div>

          <button
            onClick={handleRun}
            disabled={mutation.isPending || selectedTickers.length < 2}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity hover:opacity-90"
          >
            {mutation.isPending ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Otimizando...</>
            ) : (
              "Calcular Fronteira"
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4 lg:col-span-2">
          {mutation.isPending && <div className="flex h-64 items-center justify-center"><LoadingSpinner label="Otimizando carteiras..." /></div>}
          {mutation.isError && <ErrorMessage message={(mutation.error as Error).message} onRetry={() => mutation.reset()} />}

          {result && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    🟡 Máximo Sharpe <ConceptTooltip concept="sharpe" />
                  </p>
                  <p className="font-bold text-xl">{formatNumber(result.max_sharpe_portfolio.sharpe_ratio, 2)}</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(result.max_sharpe_portfolio.weights)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([t, w]) => (
                        <div key={t} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t}</span>
                          <span className="font-medium">{formatNumber(w, 1)}%</span>
                        </div>
                      ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Retorno: {formatNumber(result.max_sharpe_portfolio.return_pct, 2)}% · Vol: {formatNumber(result.max_sharpe_portfolio.volatility_pct, 2)}%
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">🟢 Mínima Variância</p>
                  <p className="font-bold text-xl">{formatNumber(result.min_variance_portfolio.volatility_pct, 2)}%</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(result.min_variance_portfolio.weights)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([t, w]) => (
                        <div key={t} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t}</span>
                          <span className="font-medium">{formatNumber(w, 1)}%</span>
                        </div>
                      ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Retorno: {formatNumber(result.min_variance_portfolio.return_pct, 2)}% · Sharpe: {formatNumber(result.min_variance_portfolio.sharpe_ratio, 2)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  Fronteira Eficiente <ConceptTooltip concept="markowitz" />
                </h3>
                <EfficientFrontierChart result={result} />
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-3">Estatísticas por Ativo</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="pb-2 text-left">Ativo</th>
                        <th className="pb-2 text-right">Retorno a.a.</th>
                        <th className="pb-2 text-right">Volatilidade</th>
                        <th className="pb-2 text-right">Sharpe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.entries(result.asset_stats).map(([ticker, stats]) => (
                        <tr key={ticker}>
                          <td className="py-2 font-mono text-xs">{ticker}</td>
                          <td className={`py-2 text-right tabular-nums ${stats.annual_return_pct > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                            {formatNumber(stats.annual_return_pct, 2)}%
                          </td>
                          <td className="py-2 text-right tabular-nums text-muted-foreground">{formatNumber(stats.annual_volatility_pct, 2)}%</td>
                          <td className={`py-2 text-right tabular-nums ${stats.sharpe_ratio > 1 ? "text-emerald-600" : stats.sharpe_ratio > 0 ? "text-amber-600" : "text-rose-500"}`}>
                            {formatNumber(stats.sharpe_ratio, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!result && !mutation.isPending && !mutation.isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
              <ScatterChart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Selecione pelo menos 2 ativos e calcule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
