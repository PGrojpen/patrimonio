import { Trash2, GitCompare } from "lucide-react";
import { useScenarioStore } from "@/store/scenarioStore";
import { formatBRLCompact, formatNumber } from "@/lib/formatters";
import type { SimulationResult, MonteCarloResult } from "@/types/api";

export function ComparePage() {
  const { scenarios, removeScenario, clearScenarios } = useScenarioStore();

  if (scenarios.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
        <GitCompare className="h-12 w-12 text-muted-foreground/30" />
        <p className="font-medium">Nenhum cenário salvo</p>
        <p className="text-sm text-muted-foreground">
          Use o Simulador ou Monte Carlo e clique em "Salvar cenário" para comparar aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{scenarios.length} cenário(s) salvos (máx. 4)</p>
        <button
          onClick={clearScenarios}
          className="flex items-center gap-1.5 text-xs text-destructive border border-destructive/30 rounded-md px-2 py-1 hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Limpar tudo
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {scenarios.map((scenario) => {
          const result = scenario.result;
          let finalValue = 0;
          let extraMetric = "";

          if (scenario.type === "simulation") {
            const r = result as SimulationResult;
            finalValue = r.final_value;
            extraMetric = `Retorno: ${formatNumber(r.annualized_return_pct, 2)}% a.a.`;
          } else if (scenario.type === "monte_carlo") {
            const r = result as MonteCarloResult;
            finalValue = r.p50.at(-1) ?? 0;
            extraMetric = `Mediana P50 · Vol: ${formatNumber(r.annualized_volatility_pct, 1)}%`;
          }

          return (
            <div key={scenario.id} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{scenario.type.replace("_", " ")}</p>
                </div>
                <button
                  onClick={() => removeScenario(scenario.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remover cenário"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatBRLCompact(finalValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{extraMetric}</p>
              </div>

              <div className="border-t pt-2 text-xs text-muted-foreground">
                Salvo em {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          );
        })}
      </div>

      {scenarios.length >= 2 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Comparação de Resultados Finais</h2>
          <div className="space-y-3">
            {scenarios.map((s) => {
              const result = s.result as SimulationResult | MonteCarloResult;
              const value = "final_value" in result ? result.final_value : (result as MonteCarloResult).p50.at(-1) ?? 0;
              const maxValue = Math.max(
                ...scenarios.map((sc) => {
                  const r = sc.result as SimulationResult | MonteCarloResult;
                  return "final_value" in r ? r.final_value : (r as MonteCarloResult).p50.at(-1) ?? 0;
                })
              );
              const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="tabular-nums font-mono">{formatBRLCompact(value)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
