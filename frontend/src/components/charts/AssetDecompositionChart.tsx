import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyDataPoint } from "@/types/api";
import { formatBRLCompact, formatDate } from "@/lib/formatters";

const ASSET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

interface AssetDecompositionChartProps {
  series: MonthlyDataPoint[];
  showReal?: boolean;
}

export function AssetDecompositionChart({
  series,
  showReal = false,
}: AssetDecompositionChartProps) {
  if (series.length === 0) return null;

  const assetNames = Object.keys(series[0]!.by_asset);

  const data = series.map((dp) => {
    // Para o modo real, deflaciona proporcionalmente usando real_value / total_value
    const deflator = dp.total_value > 0 ? dp.real_value / dp.total_value : 1;

    const entry: Record<string, string | number> = {
      date: formatDate(dp.date),
    };
    assetNames.forEach((name) => {
      const nominal = (dp.by_asset as Record<string, number | undefined>)[name] ?? 0;
      entry[name] = showReal ? nominal * deflator : nominal;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          {assetNames.map((name, i) => (
            <linearGradient key={name} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ASSET_COLORS[i % ASSET_COLORS.length]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={ASSET_COLORS[i % ASSET_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v: number) => formatBRLCompact(v)}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatBRLCompact(value), name]}
          labelClassName="font-medium text-foreground"
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {assetNames.map((name, i) => (
          <Area
            key={name}
            type="monotone"
            dataKey={name}
            stackId="portfolio"
            stroke={ASSET_COLORS[i % ASSET_COLORS.length]}
            fill={`url(#color-${i})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
