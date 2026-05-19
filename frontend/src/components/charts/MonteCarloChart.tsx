import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { MonteCarloResult } from "@/types/api";
import { formatBRLCompact, formatYears } from "@/lib/formatters";

interface MonteCarloChartProps {
  result: MonteCarloResult;
}

export function MonteCarloChart({ result }: MonteCarloChartProps) {
  const data = result.months.map((m, i) => ({
    month: m,
    label: m % 12 === 0 ? formatYears(m) : undefined,
    "P5 (pessimista)": result.p5[i],
    "P25": result.p25[i],
    "Mediana (P50)": result.p50[i],
    "P75": result.p75[i],
    "P95 (otimista)": result.p95[i],
  }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tickFormatter={(v: number) => (v % 12 === 0 ? `${v / 12}a` : "")}
          tick={{ fontSize: 11 }}
          tickLine={false}
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
          labelFormatter={(v: number) => formatYears(v)}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="P5 (pessimista)" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="P25" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
        <Line type="monotone" dataKey="Mediana (P50)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="P75" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
        <Line type="monotone" dataKey="P95 (otimista)" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
