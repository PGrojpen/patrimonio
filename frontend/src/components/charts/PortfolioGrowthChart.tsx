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

interface PortfolioGrowthChartProps {
  series: MonthlyDataPoint[];
  showReal?: boolean;
}

export function PortfolioGrowthChart({ series, showReal = false }: PortfolioGrowthChartProps) {
  const data = series.map((d) => ({
    date: formatDate(d.date),
    "Total Investido": d.total_invested,
    "Juros": d.interest_earned,
    ...(showReal ? { "Valor Real (IPCA)": d.real_value } : {}),
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
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
        <Area
          type="monotone"
          dataKey="Total Investido"
          stackId="1"
          stroke="#3b82f6"
          fill="url(#colorInvested)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Juros"
          stackId="1"
          stroke="#8b5cf6"
          fill="url(#colorInterest)"
          strokeWidth={2}
        />
        {showReal && (
          <Area
            type="monotone"
            dataKey="Valor Real (IPCA)"
            stackId="2"
            stroke="#10b981"
            fill="url(#colorReal)"
            strokeWidth={2}
            strokeDasharray="5 3"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
