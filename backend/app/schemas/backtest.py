from enum import Enum

from pydantic import BaseModel, Field


class RebalanceFrequency(str, Enum):
    NEVER = "never"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"


class BacktestRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=1, description="Lista de tickers")
    weights_pct: list[float] = Field(..., min_length=1, description="Pesos (%) por ticker")
    start_date: str = Field(..., description="Data início (YYYY-MM-DD)")
    end_date: str = Field(..., description="Data fim (YYYY-MM-DD)")
    initial_investment: float = Field(..., gt=0)
    monthly_contribution: float = Field(0.0, ge=0)
    rebalance_frequency: RebalanceFrequency = RebalanceFrequency.ANNUALLY
    reinvest_dividends: bool = True
    apply_taxes: bool = True


class BenchmarkReturn(BaseModel):
    name: str
    annualized_return_pct: float
    total_return_pct: float
    series: list[float]


class BacktestResult(BaseModel):
    dates: list[str]
    portfolio_values: list[float]
    real_portfolio_values: list[float]  # IPCA-adjusted
    total_invested: float
    final_value: float
    final_real_value: float
    annualized_return_pct: float
    real_annualized_return_pct: float
    max_drawdown_pct: float
    volatility_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    benchmarks: list[BenchmarkReturn]
    annual_returns: list[dict[str, float]]  # year -> return%
    warning: str | None = None  # survival bias warning
