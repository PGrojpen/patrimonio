import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/formatters";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

interface AllocationPieProps {
  data: Array<{ name: string; value: number }>;
}

export function AllocationPie({ data }: AllocationPieProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }: { name: string; value: number }) =>
            `${name}: ${formatNumber(value, 1)}%`
          }
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${formatNumber(value, 2)}%`, name]}
          contentStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
