from pydantic import BaseModel, Field


class RiskMetricsRequest(BaseModel):
    returns: list[float] = Field(..., min_length=12, description="Série de retornos mensais")
    benchmark_returns: list[float] | None = Field(
        None, description="Retornos do benchmark (Ibovespa)"
    )
    risk_free_rate_annual_pct: float = Field(
        10.5, description="Taxa livre de risco anual (CDI %)"
    )


class RiskMetrics(BaseModel):
    volatility_annual_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown_pct: float
    var_95_pct: float
    cvar_95_pct: float
    beta: float | None = None
    calmar_ratio: float
    annualized_return_pct: float


class MonteCarloRequest(BaseModel):
    initial_value: float = Field(..., gt=0)
    monthly_contribution: float = Field(0.0, ge=0)
    months: int = Field(..., ge=12, le=600)
    annual_return_pct: float = Field(..., description="Drift anualizado (%)")
    annual_volatility_pct: float = Field(..., ge=0, description="Volatilidade anualizada (%)")
    n_simulations: int = Field(10_000, ge=100, le=50_000)
    seed: int | None = None
    method: str = Field("gbm", pattern="^(gbm|bootstrap)$")
    historical_returns: list[float] | None = Field(
        None, description="Retornos históricos para bootstrap"
    )
    target_value: float | None = Field(None, gt=0, description="Meta financeira (R$)")


class MonteCarloResult(BaseModel):
    months: list[int]
    p5: list[float]
    p25: list[float]
    p50: list[float]
    p75: list[float]
    p95: list[float]
    mean: list[float]
    final_distribution: list[float]  # sampled subset of final values
    probability_of_reaching_target: float | None = None
    annualized_return_pct: float
    annualized_volatility_pct: float


class MarkowitzRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=2)
    start_date: str
    end_date: str
    n_points: int = Field(100, ge=20, le=500)
    risk_free_rate_annual_pct: float = Field(10.5)
    current_weights_pct: list[float] | None = None
    constraints: list[dict[str, float]] | None = None  # [{ticker, min, max}]


class EfficientFrontierPoint(BaseModel):
    return_pct: float
    volatility_pct: float
    sharpe_ratio: float
    weights: dict[str, float]


class MarkowitzResult(BaseModel):
    frontier: list[EfficientFrontierPoint]
    min_variance_portfolio: EfficientFrontierPoint
    max_sharpe_portfolio: EfficientFrontierPoint
    current_portfolio: EfficientFrontierPoint | None = None
    correlation_matrix: dict[str, dict[str, float]]
    asset_stats: dict[str, dict[str, float]]  # ticker -> {return, volatility, sharpe}
