import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ASSETS, CATEGORIES, assetsByCategory } from "@/lib/assets";

interface AssetSelectorProps {
  selected: string[];
  onChange: (tickers: string[]) => void;
  warnAbove?: number;
}

export function AssetSelector({ selected, onChange, warnAbove }: AssetSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? ASSETS.filter(
          (a) =>
            a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
        )
      : ASSETS;
  }, [search]);

  const groups = useMemo(() => assetsByCategory(filtered), [filtered]);

  const toggle = (ticker: string) => {
    onChange(
      selected.includes(ticker)
        ? selected.filter((t) => t !== ticker)
        : [...selected, ticker]
    );
  };

  const toggleGroup = (tickers: string[]) => {
    const allIn = tickers.every((t) => selected.includes(t));
    onChange(
      allIn
        ? selected.filter((t) => !tickers.includes(t))
        : [...new Set([...selected, ...tickers])]
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar ativo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-8"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {selected.length} selecionado{selected.length !== 1 ? "s" : ""}
        {warnAbove !== undefined && selected.length > warnAbove && (
          <span className="ml-2 text-amber-500">
            ⚠ acima de {warnAbove} pode ser lento
          </span>
        )}
      </p>

      <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
        {CATEGORIES.map((cat) => {
          const assets = groups.get(cat) ?? [];
          if (!assets.length) return null;
          const groupTickers = assets.map((a) => a.ticker);
          const allChecked = groupTickers.every((t) => selected.includes(t));

          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </span>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupTickers)}
                  className="text-[10px] text-primary hover:underline"
                >
                  {allChecked ? "Desmarcar todos" : "Marcar todos"}
                </button>
              </div>
              <div className="space-y-0.5">
                {assets.map(({ ticker, name }) => (
                  <label
                    key={ticker}
                    className="flex items-center gap-2 rounded px-1 py-0.5 text-xs cursor-pointer hover:bg-accent/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(ticker)}
                      onChange={() => toggle(ticker)}
                      className="rounded shrink-0"
                    />
                    <span className="font-mono w-[4.5rem] shrink-0 text-muted-foreground">
                      {ticker.replace(".SA", "")}
                    </span>
                    <span className="truncate">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Nenhum ativo encontrado
          </p>
        )}
      </div>
    </div>
  );
}
