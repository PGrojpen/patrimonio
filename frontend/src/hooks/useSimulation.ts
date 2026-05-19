import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  BacktestRequest,
  BacktestResult,
  MarketRates,
  MonteCarloRequest,
  MonteCarloResult,
  SimulationRequest,
  SimulationResult,
  TaxComparison,
} from "@/types/api";

export function useRunSimulation() {
  return useMutation({
    mutationFn: async (request: SimulationRequest): Promise<SimulationResult> => {
      const { data } = await api.post<SimulationResult>("/simulations/", request);
      return data;
    },
  });
}

export function useRunMonteCarlo() {
  return useMutation({
    mutationFn: async (request: MonteCarloRequest): Promise<MonteCarloResult> => {
      const { data } = await api.post<MonteCarloResult>("/monte-carlo/", request);
      return data;
    },
  });
}

export function useRunBacktest() {
  return useMutation({
    mutationFn: async (request: BacktestRequest): Promise<BacktestResult> => {
      const { data } = await api.post<BacktestResult>("/backtest/", request);
      return data;
    },
  });
}

export function useMarketRates() {
  return useQuery({
    queryKey: ["market-rates"],
    queryFn: async (): Promise<MarketRates> => {
      const { data } = await api.get<MarketRates>("/market-data/rates");
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 min
  });
}

export function useTaxComparison(grossReturn = 13.0) {
  return useQuery({
    queryKey: ["tax-comparison", grossReturn],
    queryFn: async (): Promise<TaxComparison[]> => {
      const { data } = await api.get<TaxComparison[]>(
        `/market-data/tax-comparison?gross_return_pct=${grossReturn}`
      );
      return data;
    },
  });
}
