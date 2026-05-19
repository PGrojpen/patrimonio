import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { EfficientFrontierPoint, MarkowitzResult } from "@/types/api";
import { formatNumber } from "@/lib/formatters";

interface EfficientFrontierChartProps {
  result: MarkowitzResult;
}

const CustomDot = (props: { cx?: number; cy?: number; payload?: { type: string } }) => {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  if (payload.type === "min_var") {
    return <circle cx={cx} cy={cy} r={7} fill="#10b981" stroke="#fff" strokeWidth={2} />;
  }
  if (payload.type === "max_sharpe") {
    return <circle cx={cx} cy={cy} r={7} fill="#f59e0b" stroke="#fff" strokeWidth={2} />;
  }
  if (payload.type === "current") {
    return <circle cx={cx} cy={cy} r={7} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />;
  }
  return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" opacity={0.6} />;
};

export function EfficientFrontierChart({ result }: EfficientFrontierChartProps) {
  const frontierData = result.frontier.map((p) => ({
    x: p.volatility_pct,
    y: p.return_pct,
    sharpe: p.sharpe_ratio,
    type: "frontier",
    weights: p.weights,
  }));

  const specialPoints = [
    { x: result.min_variance_portfolio.volatility_pct, y: result.min_variance_portfolio.return_pct, type: "min_var", label: "Mín. Variância" },
    { x: result.max_sharpe_portfolio.volatility_pct, y: result.max_sharpe_portfolio.return_pct, type: "max_sharpe", label: "Máx. Sharpe" },
    ...(result.current_portfolio
      ? [{ x: result.current_portfolio.volatility_pct, y: result.current_portfolio.return_pct, type: "current", label: "Sua Carteira" }]
      : []),
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            dataKey="x"
            name="Volatilidade"
            unit="%"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            label={{ value: "Volatilidade Anual (%)", position: "insideBottom", offset: -4, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Retorno"
            unit="%"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Retorno Anual (%)", angle: -90, position: "insideLeft", offset: 8, fontSize: 11 }}
          />
          <ZAxis range={[30, 30]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value: number, name: string) => [
              `${formatNumber(value, 2)}%`,
              name === "x" ? "Volatilidade" : "Retorno",
            ]}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const p = payload[0]?.payload as { x: number; y: number; sharpe?: number; label?: string; type: string };
              return (
                <div className="rounded-lg border bg-card p-2 text-xs shadow-md">
                  {p.label && <p className="font-semibold mb-1">{p.label}</p>}
                  <p>Volatilidade: {formatNumber(p.x, 2)}%</p>
                  <p>Retorno: {formatNumber(p.y, 2)}%</p>
                  {p.sharpe !== undefined && <p>Sharpe: {formatNumber(p.sharpe, 2)}</p>}
                </div>
              );
            }}
          />
          <Scatter
            name="Fronteira Eficiente"
            data={frontierData}
            fill="#3b82f6"
            shape={<CustomDot />}
          />
          <Scatter
            name="Portfólios especiais"
            data={specialPoints}
            fill="#10b981"
            shape={<CustomDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Mínima Variância
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          Máximo Sharpe
        </span>
        {result.current_portfolio && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-violet-500" />
            Sua Carteira
          </span>
        )}
      </div>
    </div>
  );
}
