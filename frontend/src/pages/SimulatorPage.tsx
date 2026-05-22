import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, Save, RefreshCw, LayoutGrid, Info } from "lucide-react";
import { useRunSimulation, useMarketRates } from "@/hooks/useSimulation";
import { AssetDecompositionChart } from "@/components/charts/AssetDecompositionChart";
import { PortfolioBuilder } from "@/components/portfolio/PortfolioBuilder";
import { MetricCard } from "@/components/ui/MetricCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatBRL, formatBRLCompact, formatNumber } from "@/lib/formatters";
import { useScenarioStore } from "@/store/scenarioStore";
import { PORTFOLIO_TEMPLATES } from "@/data/portfolioTemplates";
import type { SimulationRequest, AssetAllocation } from "@/types/api";

// ---------------------------------------------------------------------------
// Zod schema — pesos em 0-100 no form, convertidos para 0-1 na API
// ---------------------------------------------------------------------------

const assetSchema = z.object({
  name: z.string().min(1, "Informe o nome do ativo"),
  weight: z.coerce.number().min(0).max(100),
  annual_rate_pct: z.coerce.number().min(0).max(50, "Máximo 50% a.a."),
  tax_regime: z.enum(["regressive_ir", "exempt", "come_cotas", "stocks"]),
  has_fgc: z.boolean().default(false),
  indexador: z.string().nullable().optional(),
});

const schema = z.object({
  initial_investment: z.coerce.number().min(0),
  monthly_contribution: z.coerce.number().min(1, "Mínimo R$ 1"),
  annual_contribution_increase_pct: z.coerce.number().min(0).max(50),
  years: z.coerce.number().int().min(1).max(50),
  inflation_pct: z.coerce.number().min(0).max(30),
  rebalance_frequency: z.enum(["none", "monthly", "quarterly", "annual"]),
  assets: z.array(assetSchema).min(1, "Adicione ao menos um ativo"),
});

export type SimulatorFormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const MODERADO_ASSETS = PORTFOLIO_TEMPLATES.find((t) => t.id === "moderado")!;

const DEFAULTS: SimulatorFormValues = {
  initial_investment: 5000,
  monthly_contribution: 500,
  annual_contribution_increase_pct: 5,
  years: 30,
  inflation_pct: 4.5,
  rebalance_frequency: "annual",
  assets: MODERADO_ASSETS.assets.map((a) => ({
    ...a,
    weight: Math.round(a.weight * 100),
    has_fgc: a.has_fgc ?? false,
    indexador: a.indexador ?? null,
  })),
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function SimulatorPage() {
  const { data: rates } = useMarketRates();
  const [showReal, setShowReal] = useState(false);
  const mutation = useRunSimulation();
  const addScenario = useScenarioStore((s) => s.addScenario);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SimulatorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const onSubmit = (values: SimulatorFormValues) => {
    const totalWeight = values.assets.reduce((s, a) => s + Number(a.weight), 0);
    const payload: SimulationRequest = {
      ...values,
      assets: values.assets.map((a) => ({
        ...a,
        weight: Number(a.weight) / totalWeight, // normaliza para 0-1
        indexador: (a.indexador as AssetAllocation["indexador"]) ?? undefined,
      })),
    };
    mutation.mutate(payload);
  };

  const loadTemplate = (templateId: string) => {
    const tpl = PORTFOLIO_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    reset({
      ...DEFAULTS,
      rebalance_frequency: tpl.rebalance_frequency,
      assets: tpl.assets.map((a) => ({
        ...a,
        weight: Math.round(a.weight * 100),
        has_fgc: a.has_fgc ?? false,
        indexador: a.indexador ?? null,
      })),
    });
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

  return (
    <div className="space-y-6">
      {/* Template cards */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          <LayoutGrid className="inline h-3.5 w-3.5 mr-1" />
          Exemplos didáticos para partir de algum lugar. Não são recomendações.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PORTFOLIO_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => loadTemplate(tpl.id)}
              className="rounded-lg border bg-card p-3 text-left text-xs transition-colors hover:border-primary hover:bg-accent"
            >
              <p className="font-semibold">{tpl.label}</p>
              <p className="mt-0.5 text-muted-foreground leading-tight">{tpl.description}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3">
        {/* ----------------------------------------------------------------- */}
        {/* Form panel */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Parâmetros
            </h2>

            <Field label="Aporte inicial (R$)" error={errors.initial_investment?.message}>
              <input
                type="number"
                min={0}
                step={100}
                {...register("initial_investment")}
                className="input-field"
              />
            </Field>

            <Field label="Aporte mensal (R$)" error={errors.monthly_contribution?.message}>
              <input
                type="number"
                min={1}
                step={50}
                {...register("monthly_contribution")}
                className="input-field"
              />
            </Field>

            <Field
              label="Aumento anual do aporte (%)"
              error={errors.annual_contribution_increase_pct?.message}
            >
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                {...register("annual_contribution_increase_pct")}
                className="input-field"
              />
            </Field>

            <Field label="Prazo (anos)" error={errors.years?.message}>
              <input
                type="number"
                min={1}
                max={50}
                {...register("years")}
                className="input-field"
              />
            </Field>

            <Field label="IPCA projetado anual (%)" error={errors.inflation_pct?.message}>
              <input
                type="number"
                min={0}
                max={30}
                step={0.1}
                {...register("inflation_pct")}
                className="input-field"
              />
              {rates && (
                <p className="text-xs text-muted-foreground mt-1">
                  CDI atual: {formatNumber(rates.cdi_aa, 2)}% a.a.
                </p>
              )}
            </Field>

            <Field label="Rebalanceamento" error={errors.rebalance_frequency?.message}>
              <select {...register("rebalance_frequency")} className="input-field">
                <option value="none">Nunca</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </Field>

            {/* Portfolio builder */}
            <div className="pt-1">
              <PortfolioBuilder
                control={control}
                register={register}
                errors={errors}
                setValue={setValue}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity hover:opacity-90"
              >
                {mutation.isPending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Calculando...
                  </>
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

        {/* ----------------------------------------------------------------- */}
        {/* Results panel */}
        {/* ----------------------------------------------------------------- */}
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
              {/* Summary metrics */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Patrimônio Final"
                  value={formatBRLCompact(result.final_value)}
                  sub="Valor nominal líquido de IR"
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
                  label="IR Total Pago"
                  value={formatBRLCompact(result.total_ir_paid)}
                  sub={`${formatNumber((result.total_ir_paid / Math.max(result.final_value + result.total_ir_paid, 1)) * 100, 1)}% do bruto`}
                  trend="down"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Retorno Ponderado a.a."
                  value={`${formatNumber(result.annualized_return_pct, 2)}%`}
                  sub="Média ponderada pelos pesos"
                />
                <MetricCard
                  label="Retorno Real a.a."
                  value={`${formatNumber(result.real_annualized_return_pct, 2)}%`}
                  sub="Descontada a inflação"
                  trend={result.real_annualized_return_pct > 0 ? "up" : "down"}
                />
              </div>

              {/* Decomposed chart */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Evolução por Ativo</h3>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showReal}
                      onChange={(e) => setShowReal(e.target.checked)}
                      className="rounded"
                    />
                    Valor real (IPCA)
                  </label>
                </div>
                <AssetDecompositionChart series={result.series} showReal={showReal} />
              </div>

              {/* Per-asset breakdown table + summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <AssetBreakdownTable byAsset={result.by_asset} />

                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-semibold mb-3">Decomposição do retorno</h3>
                  <ReturnDecomposition result={result} />
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AssetBreakdownTable({
  byAsset,
}: {
  byAsset: import("@/types/api").AssetSummary[];
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-1.5">
        Composição final
        <span
          title="Peso final pode diferir do alvo sem rebalanceamento frequente (drift)"
          className="text-muted-foreground cursor-help"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="pb-2 text-left font-medium">Ativo</th>
              <th className="pb-2 text-right font-medium">Alvo</th>
              <th className="pb-2 text-right font-medium">Final</th>
              <th className="pb-2 text-right font-medium">Valor</th>
              <th className="pb-2 text-right font-medium">IR pago</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {byAsset.map((a) => (
              <tr key={a.name}>
                <td className="py-1.5 pr-2 font-medium truncate max-w-[90px]" title={a.name}>
                  {a.name}
                </td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                  {formatNumber(a.weight_target * 100, 1)}%
                </td>
                <td
                  className={`py-1.5 text-right tabular-nums ${
                    Math.abs(a.weight_final - a.weight_target) > 0.05
                      ? "text-amber-600 dark:text-amber-400"
                      : ""
                  }`}
                >
                  {formatNumber(a.weight_final * 100, 1)}%
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatBRLCompact(a.final_value)}
                </td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                  {a.ir_paid > 0 ? formatBRLCompact(a.ir_paid) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="pt-2" colSpan={3}>
                Total
              </td>
              <td className="pt-2 text-right tabular-nums">
                {formatBRLCompact(byAsset.reduce((s, a) => s + a.final_value, 0))}
              </td>
              <td className="pt-2 text-right tabular-nums text-muted-foreground">
                {formatBRLCompact(byAsset.reduce((s, a) => s + a.ir_paid, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ReturnDecomposition({
  result,
}: {
  result: import("@/types/api").SimulationResult;
}) {
  const grossFinal = result.final_value + result.total_ir_paid;
  const grossReturn = grossFinal - result.total_invested;
  const inflationLoss = grossFinal - result.final_real_value - result.total_ir_paid;

  const rows: [string, number, "pos" | "neg"][] = [
    ["Aportes totais", result.total_invested, "pos"],
    ["Rendimento bruto", grossReturn, "pos"],
    ["IR pago (todos os regimes)", -result.total_ir_paid, "neg"],
    ["Corrosão por inflação", -inflationLoss, "neg"],
  ];

  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([label, value, sign]) => (
        <div key={label} className="flex justify-between border-b pb-1.5 last:border-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd
            className={`font-medium tabular-nums ${
              sign === "neg" ? "text-destructive" : ""
            }`}
          >
            {value >= 0 ? "+" : ""}
            {formatBRL(value)}
          </dd>
        </div>
      ))}
      <div className="flex justify-between pt-1">
        <dt className="font-semibold">Ganho líquido real</dt>
        <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatBRL(result.final_real_value - result.total_invested)}
        </dd>
      </div>
    </dl>
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
