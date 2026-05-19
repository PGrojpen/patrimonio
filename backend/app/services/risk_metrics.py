"""Risk metrics: Sharpe, Sortino, VaR, CVaR, drawdown, beta."""

import numpy as np
import numpy.typing as npt

from app.schemas.risk import RiskMetrics, RiskMetricsRequest
from app.utils.financial import annualize_return, drawdown_series, monthly_rate


def compute_risk_metrics(request: RiskMetricsRequest) -> RiskMetrics:
    """
    Compute comprehensive risk metrics from a monthly returns series.

    All returns inputs are expected as decimals (e.g., 0.01 = 1%).
    """
    returns = np.array(request.returns, dtype=np.float64)
    rf_monthly = monthly_rate(request.risk_free_rate_annual_pct)

    # Annualized return and volatility (√12 convention for monthly data)
    mean_monthly = float(np.mean(returns))
    annualized_return_pct = annualize_return(mean_monthly)
    volatility_annual_pct = float(np.std(returns, ddof=1)) * np.sqrt(12) * 100

    # Sharpe Ratio: (Rp - Rf) / σp — annualized
    excess_returns = returns - rf_monthly
    sharpe = (
        float(np.mean(excess_returns)) / float(np.std(excess_returns, ddof=1)) * np.sqrt(12)
        if np.std(excess_returns, ddof=1) > 0
        else 0.0
    )

    # Sortino Ratio: (Rp - Rf) / σd — only downside deviation
    downside = returns[returns < rf_monthly] - rf_monthly
    downside_std = float(np.std(downside, ddof=1)) * np.sqrt(12) if len(downside) > 1 else 0.0001
    sortino = (annualized_return_pct / 100 - request.risk_free_rate_annual_pct / 100) / (
        downside_std / 100
    ) if downside_std > 0 else 0.0

    # Drawdown from cumulative returns
    cum_values = np.cumprod(1 + returns)
    cum_values = np.insert(cum_values, 0, 1.0)
    dd_series = drawdown_series(cum_values)
    max_dd = float(dd_series.min())

    # VaR 95% (historical, 5th percentile)
    var_95 = float(np.percentile(returns, 5)) * 100

    # CVaR 95% (conditional / expected shortfall)
    tail = returns[returns <= np.percentile(returns, 5)]
    cvar_95 = float(np.mean(tail)) * 100 if len(tail) > 0 else var_95

    # Calmar Ratio: annualized return / max drawdown (absolute)
    calmar = (annualized_return_pct / abs(max_dd)) if max_dd < 0 else 0.0

    # Beta vs benchmark
    beta: float | None = None
    if request.benchmark_returns and len(request.benchmark_returns) == len(returns):
        bench = np.array(request.benchmark_returns, dtype=np.float64)
        cov_matrix = np.cov(returns, bench)
        bench_var = float(np.var(bench, ddof=1))
        if bench_var > 0:
            beta = float(cov_matrix[0, 1] / bench_var)

    return RiskMetrics(
        volatility_annual_pct=round(volatility_annual_pct, 4),
        sharpe_ratio=round(sharpe, 4),
        sortino_ratio=round(sortino, 4),
        max_drawdown_pct=round(max_dd, 4),
        var_95_pct=round(var_95, 4),
        cvar_95_pct=round(cvar_95, 4),
        beta=round(beta, 4) if beta is not None else None,
        calmar_ratio=round(calmar, 4),
        annualized_return_pct=round(annualized_return_pct, 4),
    )
