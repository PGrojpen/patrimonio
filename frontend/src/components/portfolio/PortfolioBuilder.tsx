import { useFieldArray, useWatch, useController } from "react-hook-form";
import type { Control, UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { Trash2, Plus, CheckCircle2, XCircle } from "lucide-react";
import type { SimulatorFormValues } from "@/pages/SimulatorPage";
import { TAX_REGIME_LABELS } from "@/data/portfolioTemplates";

interface PortfolioBuilderProps {
  control: Control<SimulatorFormValues>;
  register: UseFormRegister<SimulatorFormValues>;
  errors: FieldErrors<SimulatorFormValues>;
  setValue: UseFormSetValue<SimulatorFormValues>;
}

export function PortfolioBuilder({
  control,
  register,
  errors,
  setValue,
}: PortfolioBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "assets" });

  const assets = useWatch({ control, name: "assets" }) ?? [];
  const totalWeight = assets.reduce((sum, a) => sum + (Number(a?.weight) || 0), 0);
  const weightOk = Math.abs(totalWeight - 100) < 1;

  const handleNormalize = () => {
    if (totalWeight === 0) return;
    assets.forEach((a, i) => {
      const normalized = parseFloat(((Number(a.weight) / totalWeight) * 100).toFixed(1));
      setValue(`assets.${i}.weight`, normalized, { shouldValidate: true });
    });
  };

  const handleAddAsset = () => {
    const remaining = Math.max(0, parseFloat((100 - totalWeight).toFixed(1)));
    append({
      name: "",
      weight: remaining,
      annual_rate_pct: 12.0,
      tax_regime: "regressive_ir",
      has_fgc: false,
      indexador: null,
    });
  };

  return (
    <div className="space-y-3">
      {/* Weight indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">Ativos da carteira</span>
        <span
          className={`flex items-center gap-1 font-semibold tabular-nums ${
            weightOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          }`}
        >
          {weightOk ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {totalWeight.toFixed(1)}%
          {!weightOk && (
            <button
              type="button"
              onClick={handleNormalize}
              className="ml-1 text-xs text-primary underline-offset-2 hover:underline"
            >
              Normalizar
            </button>
          )}
        </span>
      </div>

      {/* Asset rows */}
      {fields.map((field, index) => (
        <AssetRow
          key={field.id}
          index={index}
          control={control}
          register={register}
          error={errors.assets?.[index]}
          onRemove={() => remove(index)}
          canRemove={fields.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={handleAddAsset}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar ativo
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset row
// ---------------------------------------------------------------------------

interface AssetRowProps {
  index: number;
  control: Control<SimulatorFormValues>;
  register: UseFormRegister<SimulatorFormValues>;
  error?: FieldErrors<SimulatorFormValues["assets"][number]>;
  onRemove: () => void;
  canRemove: boolean;
}

function AssetRow({ index, control, register, error, onRemove, canRemove }: AssetRowProps) {
  const { field: weightField } = useController({
    control,
    name: `assets.${index}.weight`,
  });

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* Row header: name + weight + delete */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <input
            {...register(`assets.${index}.name`)}
            placeholder="Nome do ativo"
            className="input-field w-full text-sm"
          />
          {error?.name && (
            <p className="mt-0.5 text-xs text-destructive">{error.name.message}</p>
          )}
        </div>

        {/* Weight control */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={weightField.value ?? 0}
            onChange={(e) => weightField.onChange(Number(e.target.value))}
            className="w-20 accent-primary"
            aria-label={`Peso do ativo ${index + 1}`}
          />
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={weightField.value ?? 0}
              onChange={(e) => weightField.onChange(Number(e.target.value))}
              onBlur={weightField.onBlur}
              className="input-field w-16 text-right text-sm"
              aria-label={`Percentual do ativo ${index + 1}`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remover ativo"
          className="mt-1 rounded p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Asset details: rate + tax regime */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Taxa a.a. (%)</label>
          <input
            type="number"
            min={0}
            max={50}
            step={0.1}
            {...register(`assets.${index}.annual_rate_pct`)}
            className="input-field w-full text-sm"
          />
          {error?.annual_rate_pct && (
            <p className="mt-0.5 text-xs text-destructive">{error.annual_rate_pct.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tributação</label>
          <select
            {...register(`assets.${index}.tax_regime`)}
            className="input-field w-full text-sm"
          >
            {Object.entries(TAX_REGIME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FGC checkbox */}
      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          {...register(`assets.${index}.has_fgc`)}
          className="rounded"
        />
        Coberto pelo FGC
      </label>
    </div>
  );
}
