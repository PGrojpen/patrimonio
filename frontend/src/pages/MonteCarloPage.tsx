import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LineChart, RefreshCw, Save } from "lucide-react";
import { useRunMonteCarlo } from "@/hooks/useSimulation";
import { MonteCarloChart } from "@/components/charts/MonteCarloChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConceptTooltip } from "@/components/educational/ConceptTooltip";
import { formatBRLCompact, formatNumber } from "@/lib/formatters";
import { useScenarioStore } from "@/store/scenarioStore";
import type { MonteCarloRequest } from "@/types/api";

const schema = z.object({
  initial_value: z.coerce.number().min(1),
  monthly_contribution: z.coerce.number().min(0),
  years: z.coerce.number().int().min(1).max(50),
  annual_return_pct: z.coerce.number().min(-50).max(100),
  annual_volatility_pct: z.coerce.number().min(0).max(100),
  n_simulations: z.coerce.number().int().min(100).max(50000),
  method: z.enum(["gbm", "bootstrap"]),
  target_value: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function MonteCarloPage() {
  const mutation = useRunMonteCarlo();
  const addScenario = useScenarioStore((s) => s.addScenario);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      initial_value: 10_000,
      monthly_contribution: 500,
      years: 20,
      annual_return_pct: 10.0,
      annual_volatility_pct: 20.0,
      n_simulations: 5000,
      method: "gbm",
    },
  });

  const onSubmit = (values: FormValues) => {
    const req: MonteCarloRequest = {
      ...values,
      months: values.years * 12,
      target_value: values.target_value && values.target_value > 0 ? values.target_value : undefined,
    };
    mutation.mutate(req);
  };

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" />
              Parâmetros{" "}
              <ConceptTooltip concept="gbm" />
            </h2>

            {[
              ["Valor inicial (R$)", "initial_value", { min: 1, step: 1000 }],
              ["Aporte mensal (R$)", "monthly_contribution", { min: 0, step: 100 }],
              ["Prazo (anos)", "years", { min: 1, max: 50 }],
              ["Retorno anual esperado (%)", "annual_return_pct", { min: -50, max: 100, step: 0.5 }],
              ["Volatilidade anual (%)", "annual_volatility_pct", { min: 0, max: 100, step: 0.5 }],
              ["Número de simulações", "n_simulations", { min: 100, max: 50000, step: 1000 }],
              ["Meta financeira (R$) — opcional", "target_value", { min: 0, step: 10000 }],
            ].map(([label, field, attrs]) => (
              <div key={field as string} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{label as string}</label>
                <input
                  type="number"
                  {...(attrs as object)}
                  {...register(field as keyof FormValues)}
                  className="input-field"
                />
                {errors[field as keyof FormValues] && (
                  <p className="text-xs text-destructive">{errors[field as keyof FormValues]?.message}</p>
                )}
              </div>
            ))}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Método</label>
              <select {...register("method")} className="input-field">
                <option value="gbm">Geometric Brownian Motion</option>
                <option value="bootstrap">Bootstrap histórico</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity hover:opacity-90"
            >
              {mutation.isPending ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Simulando...</>
              ) : (
                "Executar Monte Carlo"
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {mutation.isPending && (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner label={`Executando ${watch("n_simulations").toLocaleString("pt-BR")} simulações...`} />
            </div>
          )}

          {mutation.isError && (
            <ErrorMessage message={(mutation.error as Error).message} onRetry={() => mutation.reset()} />
          )}

          {result && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Mediana (P50)" value={formatBRLCompact(result.p50.at(-1) ?? 0)} trend="up" />
                <MetricCard label="Pessimista (P5)" value={formatBRLCompact(result.p5.at(-1) ?? 0)} trend="down" />
                <MetricCard label="Otimista (P95)" value={formatBRLCompact(result.p95.at(-1) ?? 0)} trend="up" />
                {result.probability_of_reaching_target !== null && result.probability_of_reaching_target !== undefined ? (
                  <MetricCard
                    label="Prob. de atingir meta"
                    value={`${formatNumber(result.probability_of_reaching_target * 100, 1)}%`}
                    sub="Percentual de simulações"
                    trend={result.probability_of_reaching_target > 0.5 ? "up" : "down"}
                  />
                ) : (
                  <MetricCard label="Retorno Anualizado" value={`${formatNumber(result.annualized_return_pct, 2)}%`} sub="Mediana" />
                )}
              </div>

              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  Projeção Monte Carlo{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (bandas de percentis)
                  </span>
                </h3>
                <MonteCarloChart result={result} />
              </div>

              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Interpretação</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (!mutation.variables) return;
                      addScenario({ name: `Monte Carlo ${new Date().toLocaleDateString("pt-BR")}`, type: "monte_carlo", request: mutation.variables, result });
                    }}
                    className="flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 hover:bg-accent transition-colors"
                  >
                    <Save className="h-3 w-3" /> Salvar
                  </button>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• <strong className="text-foreground">P50 (mediana):</strong> em 50% dos cenários, você terá pelo menos {formatBRLCompact(result.p50.at(-1) ?? 0)}</li>
                  <li>• <strong className="text-foreground">P5 (pessimista):</strong> nos piores 5% dos cenários, valor seria {formatBRLCompact(result.p5.at(-1) ?? 0)}</li>
                  <li>• <strong className="text-foreground">P95 (otimista):</strong> nos melhores 5%, chegaria a {formatBRLCompact(result.p95.at(-1) ?? 0)}</li>
                  <li>• Volatilidade de {formatNumber(result.annualized_volatility_pct, 1)}% a.a. gera uma dispersão de <strong className="text-foreground">{formatNumber(((result.p95.at(-1) ?? 1) / (result.p5.at(-1) ?? 1)), 1)}×</strong> entre P95 e P5</li>
                </ul>
              </div>
            </>
          )}

          {!result && !mutation.isPending && !mutation.isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
              <LineChart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Configure e execute as simulações</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
