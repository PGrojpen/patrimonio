import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SimulatorPage } from "@/pages/SimulatorPage";
import { BacktestPage } from "@/pages/BacktestPage";
import { MonteCarloPage } from "@/pages/MonteCarloPage";
import { MarkowitzPage } from "@/pages/MarkowitzPage";
import { ComparePage } from "@/pages/ComparePage";
import { LearnPage } from "@/pages/LearnPage";
import { HomePage } from "@/pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="backtest" element={<BacktestPage />} />
          <Route path="monte-carlo" element={<MonteCarloPage />} />
          <Route path="markowitz" element={<MarkowitzPage />} />
          <Route path="comparar" element={<ComparePage />} />
          <Route path="aprenda" element={<LearnPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
