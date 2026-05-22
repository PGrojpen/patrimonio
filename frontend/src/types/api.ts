// Types mirroring the backend Pydantic schemas

// ---------------------------------------------------------------------------
// Multi-asset simulation (novo — v1.1)
// ---------------------------------------------------------------------------

export type TaxRegime = "regressive_ir" | "exempt" | "come_cotas" | "stocks";
export type Indexador = "pre" | "pos_cdi" | "pos_selic" | "ipca_plus" | "hybrid" | "equity";
export type RebalanceFrequency = "none" | "monthly" | "quarterly" | "annual";

export interface AssetAllocation {
  name: string;
  weight: number; // 0.0–1.0, soma deve ser 1.0
  annual_rate_pct: number;
  tax_regime: TaxRegime;
  has_fgc?: boolean;
  indexador?: Indexador | null;
}

export interface MonthlyDataPoint {
  month: number;
  date: string;
  total_invested: number;
  interest_earned: number;
  total_value: number;
  real_value: number;
  by_asset: Record<string, number>; // nome → valor (precisão total, pré-IR de resgate)
}

export interface AssetSummary {
  name: string;
  final_value: number;
  final_value_real: number;
  total_contributed: number;
  total_interest: number;
  ir_paid: number;
  weight_target: number;
  weight_final: number;
}

export interface SimulationRequest {
  initial_investment: number;
  monthly_contribution: number;
  annual_contribution_increase_pct: number;
  years: number;
  inflation_pct: number;
  assets: AssetAllocation[];
  rebalance_frequency?: RebalanceFrequency;
  apply_costs?: boolean;
}

export interface SimulationResult {
  total_invested: number;
  total_interest: number;
  final_value: number;
  final_real_value: number;
  annualized_return_pct: number;
  real_annualized_return_pct: number;
  series: MonthlyDataPoint[];
  by_asset: AssetSummary[];
  total_ir_paid: number;
}

// ---------------------------------------------------------------------------
// Monte Carlo
// ---------------------------------------------------------------------------

export interface MonteCarloRequest {
  initial_value: number;
  monthly_contribution: number;
  months: number;
  annual_return_pct: number;
  annual_volatility_pct: number;
  n_simulations: number;
  seed?: number;
  method?: "gbm" | "bootstrap";
  historical_returns?: number[];
  target_value?: number;
}

export interface MonteCarloResult {
  months: number[];
  p5: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p95: number[];
  mean: number[];
  final_distribution: number[];
  probability_of_reaching_target?: number;
  annualized_return_pct: number;
  annualized_volatility_pct: number;
}

// ---------------------------------------------------------------------------
// Backtest
// ---------------------------------------------------------------------------

export interface BacktestRequest {
  tickers: string[];
  weights_pct: number[];
  start_date: string;
  end_date: string;
  initial_investment: number;
  monthly_contribution: number;
  rebalance_frequency: "never" | "monthly" | "quarterly" | "annually";
  reinvest_dividends: boolean;
  apply_taxes: boolean;
}

export interface BenchmarkReturn {
  name: string;
  annualized_return_pct: number;
  total_return_pct: number;
  series: number[];
}

export interface BacktestResult {
  dates: string[];
  portfolio_values: number[];
  real_portfolio_values: number[];
  total_invested: number;
  final_value: number;
  final_real_value: number;
  annualized_return_pct: number;
  real_annualized_return_pct: number;
  max_drawdown_pct: number;
  volatility_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  benchmarks: BenchmarkReturn[];
  annual_returns: Array<{ year: number; return_pct: number }>;
  warning?: string;
}

// ---------------------------------------------------------------------------
// Markowitz
// ---------------------------------------------------------------------------

export interface MarkowitzRequest {
  tickers: string[];
  start_date: string;
  end_date: string;
  n_points?: number;
  risk_free_rate_annual_pct?: number;
  current_weights_pct?: number[];
}

export interface EfficientFrontierPoint {
  return_pct: number;
  volatility_pct: number;
  sharpe_ratio: number;
  weights: Record<string, number>;
}

export interface MarkowitzResult {
  frontier: EfficientFrontierPoint[];
  min_variance_portfolio: EfficientFrontierPoint;
  max_sharpe_portfolio: EfficientFrontierPoint;
  current_portfolio?: EfficientFrontierPoint;
  correlation_matrix: Record<string, Record<string, number>>;
  asset_stats: Record<string, { annual_return_pct: number; annual_volatility_pct: number; sharpe_ratio: number }>;
}

// ---------------------------------------------------------------------------
// Risk / Market
// ---------------------------------------------------------------------------

export interface RiskMetrics {
  volatility_annual_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_pct: number;
  var_95_pct: number;
  cvar_95_pct: number;
  beta?: number;
  calmar_ratio: number;
  annualized_return_pct: number;
}

export interface AssetInfo {
  ticker: string;
  name: string;
  asset_class: string;
  tax_regime: string;
}

export interface MarketRates {
  selic_aa: number;
  cdi_aa: number;
  poupanca_aa: number;
}

export interface TaxComparison {
  regime: string;
  gross_return_pct: number;
  net_return_pct: number;
  tax_drag_pct: number;
}

// ---------------------------------------------------------------------------
// Saved scenarios (localStorage)
// ---------------------------------------------------------------------------

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  type: "simulation" | "monte_carlo" | "backtest";
  request: SimulationRequest | MonteCarloRequest | BacktestRequest;
  result: SimulationResult | MonteCarloResult | BacktestResult;
}
