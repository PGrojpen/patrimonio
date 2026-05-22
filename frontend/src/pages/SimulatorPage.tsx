import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, Save, RefreshCw } from "lucide-react";
import { useRunSimulation, useMarketRates } from "@/hooks/useSimulation";
import { PortfolioGrowthChart } from "@/components/charts/PortfolioGrowthChart";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { AllocationPie } from "@/components/charts/AllocationPie";
import { formatBRL, formatBRLCompact, formatNumber } from "@/lib/formatters";
import { useScenarioStore } from "@/store/scenarioStore";
import type { SimulationRequest, SimulationResult } from "@/types/api";

const schema = z.object({
  initial_investment: z.coerce.number().min(0),
  monthly_contribution: z.coerce.number().min(0),
  annual_contribution_increase_pct: z.coerce.number().min(0).max(50),
  years: z.coerce.number().int().min(1).max(50),
  annual_rate_pct: z.coerce.number().min(0.1).max(50),
  inflation_pct: z.coerce.number().min(0).max(30),
});

type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  initial_investment: 5000,
  monthly_contribution: 500,
  annual_contribution_increase_pct: 5,
  years: 30,
  annual_rate_pct: 11.0,
  inflation_pct: 4.5,
};

export function SimulatorPage() {
  const { data: rates } = useMarketRates();
  const [showReal, setShowReal] = useState(false);
  const mutation = useRunSimulation();
  const addScenario = useScenarioStore((s) => s.addScenario);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values as SimulationRequest);
  };

  const result = mutation.data;

  const saveScenario = () => {
    if (!result || !mutation.variables) return;
    addScenario({
      name: `Simulação ${new Date().toLocaleDateString("pt-BR")}`,
      type: "simulation",
      request: mutation.variables,
      result,
    });
  };

  const pieData = result
    ? [
        { name: "Investido", value: (result.total_invested / result.final_value) * 100 },
        { name: "Juros", value: (result.total_interest / result.final_value) * 100 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3">
        {/* Form panel */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Parâmetros
            </h2>

            <Field label="Aporte inicial (R$)" error={errors.initial_investment?.message}>
              <input type="number" min={0} step={100} {...register("initial_investment")}
                className="input-field" />
            </Field>

            <Field label="Aporte mensal (R$)" error={errors.monthly_contribution?.message}>
              <input type="number" min={0} step={1} {...register("monthly_contribution")}
                className="input-field" />
            </Field>

            <Field label="Aumento anual do aporte (%)" error={errors.annual_contribution_increase_pct?.message}>
              <input type="number" min={0} max={50} step={0.5} {...register("annual_contribution_increase_pct")}
                className="input-field" />
              <p className="text-xs text-muted-foreground mt-1">
                Crescimento anual do aporte (ex: acompanhar inflação)
              </p>
            </Field>

            <Field label="Prazo (anos)" error={errors.years?.message}>
              <input type="number" min={1} max={50} {...register("years")}
                className="input-field" />
            </Field>

            <Field label="Taxa de retorno anual (%)" error={errors.annual_rate_pct?.message}>
              <input type="number" min={0} max={50} step={0.1} {...register("annual_rate_pct")}
                className="input-field" />
              {rates && (
                <p className="text-xs text-muted-foreground mt-1">
                  CDI atual: {formatNumber(rates.cdi_aa, 2)}% a.a.
                </p>
              )}
            </Field>

            <Field label="IPCA projetado anual (%)" error={errors.inflation_pct?.message}>
              <input type="number" min={0} max={30} step={0.1} {...register("inflation_pct")}
                className="input-field" />
            </Field>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity hover:opacity-90"
              >
                {mutation.isPending ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculando...</>
                ) : (
                  "Simular"
                )}
              </button>
              <button
                type="button"
                onClick={() => reset(DEFAULTS)}
                className="rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent"
                title="Resetar valores"
              >
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="space-y-4 lg:col-span-2">
          {mutation.isPending && (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner label="Calculando projeção..." />
            </div>
          )}

          {mutation.isError && (
            <ErrorMessage
              message={(mutation.error as Error).message}
              onRetry={() => mutation.reset()}
            />
          )}

          {result && (
            <>
              {/* Metrics */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Patrimônio Final"
                  value={formatBRLCompact(result.final_value)}
                  sub="Valor nominal"
                  trend="up"
                />
                <MetricCard
                  label="Valor Real (IPCA)"
                  value={formatBRLCompact(result.final_real_value)}
                  sub="Poder de compra hoje"
                  trend="up"
                />
                <MetricCard
                  label="Total Investido"
                  value={formatBRLCompact(result.total_invested)}
                  sub="Seus aportes"
                />
                <MetricCard
                  label="Juros Ganhos"
                  value={formatBRLCompact(result.total_interest)}
                  sub={`${formatNumber((result.total_interest / result.final_value) * 100, 1)}% do total`}
                  trend="up"
                />
              </div>

              {/* Return rates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Retorno Nominal a.a."
                  value={`${formatNumber(result.annualized_return_pct, 2)}%`}
                  sub="Taxa inserida"
                />
                <MetricCard
                  label="Retorno Real a.a."
                  value={`${formatNumber(result.real_annualized_return_pct, 2)}%`}
                  sub="Descontada a inflação"
                  trend={result.real_annualized_return_pct > 0 ? "up" : "down"}
                />
              </div>

              {/* Chart */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Evolução Patrimonial</h3>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReal}
                      onChange={(e) => setShowReal(e.target.checked)}
                      className="rounded"
                    />
                    Mostrar valor real (IPCA)
                  </label>
                </div>
                <PortfolioGrowthChart series={result.series} showReal={showReal} />
              </div>

              {/* Composition */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold mb-2">Composição Final</h3>
                  <AllocationPie data={pieData} />
                </div>
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold mb-3">Resumo</h3>
                  <dl className="space-y-2 text-sm">
                    {[
                      ["Aporte inicial", formatBRL(mutation.variables?.initial_investment ?? 0)],
                      ["Aporte mensal final", formatBRL(result.series.at(-1)?.total_invested ?? 0)],
                      ["Total de meses", String(result.series.length)],
                      ["Patrimônio final", formatBRL(result.final_value)],
                      ["Multiplicador", `${formatNumber(result.final_value / Math.max(result.total_invested, 1), 2)}×`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b pb-1.5 last:border-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={saveScenario}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Salvar cenário
                  </button>
                </div>
              </div>
            </>
          )}

          {!result && !mutation.isPending && !mutation.isError && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Preencha os parâmetros e clique em <strong>Simular</strong>
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
