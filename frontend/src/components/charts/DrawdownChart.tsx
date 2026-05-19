import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/formatters";

interface DrawdownChartProps {
  dates: string[];
  values: number[];
}

function computeDrawdown(values: number[]): number[] {
  const dd: number[] = [];
  let peak = values[0] ?? 1;
  for (const v of values) {
    if (v > peak) peak = v;
    dd.push(((v - peak) / peak) * 100);
  }
  return dd;
}

export function DrawdownChart({ dates, values }: DrawdownChartProps) {
  const dd = computeDrawdown(values);
  const data = dates.map((d, i) => ({
    date: d.slice(0, 7),
    drawdown: dd[i] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
        <YAxis
          tickFormatter={(v: number) => `${formatNumber(v, 1)}%`}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          domain={["auto", 0]}
        />
        <Tooltip
          formatter={(v: number) => [`${formatNumber(v, 2)}%`, "Drawdown"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="#ef4444"
          fill="url(#ddGrad)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
