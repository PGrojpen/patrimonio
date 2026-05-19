"""Markowitz efficient frontier optimization using scipy."""

from typing import Any

import numpy as np
import numpy.typing as npt
from scipy.optimize import minimize  # type: ignore[import-untyped]

from app.schemas.risk import EfficientFrontierPoint, MarkowitzRequest, MarkowitzResult


def _portfolio_stats(
    weights: npt.NDArray[np.float64],
    mean_returns: npt.NDArray[np.float64],
    cov_matrix: npt.NDArray[np.float64],
) -> tuple[float, float]:
    """Return (annualized_return, annualized_volatility) for given weights."""
    port_return = float(np.dot(weights, mean_returns)) * 12 * 100  # annual %
    port_vol = float(np.sqrt(weights @ cov_matrix @ weights)) * np.sqrt(12) * 100  # annual %
    return port_return, port_vol


def _optimize(
    mean_returns: npt.NDArray[np.float64],
    cov_matrix: npt.NDArray[np.float64],
    n_assets: int,
    objective: str = "min_variance",
    target_return: float | None = None,
    rf_monthly: float = 0.0,
    constraints_extra: list[dict[str, Any]] | None = None,
    bounds: list[tuple[float, float]] | None = None,
) -> npt.NDArray[np.float64] | None:
    """Generic portfolio optimizer using scipy.minimize (SLSQP)."""
    w0 = np.ones(n_assets) / n_assets
    _bounds = bounds or [(0.0, 1.0)] * n_assets
    base_constraints: list[dict[str, Any]] = [
        {"type": "eq", "fun": lambda w: np.sum(w) - 1.0}
    ]
    if target_return is not None:
        base_constraints.append(
            {"type": "eq", "fun": lambda w: np.dot(w, mean_returns) * 12 - target_return / 100}
        )
    if constraints_extra:
        base_constraints.extend(constraints_extra)

    if objective == "min_variance":
        def obj(w: npt.NDArray[np.float64]) -> float:
            return float(w @ cov_matrix @ w)
    elif objective == "max_sharpe":
        def obj(w: npt.NDArray[np.float64]) -> float:
            ret = float(np.dot(w, mean_returns)) * 12
            vol = float(np.sqrt(w @ cov_matrix @ w)) * np.sqrt(12)
            return -(ret - rf_monthly * 12) / vol if vol > 0 else 0.0
    else:
        raise ValueError(f"Unknown objective: {objective}")

    result = minimize(
        obj,
        w0,
        method="SLSQP",
        bounds=_bounds,
        constraints=base_constraints,
        options={"ftol": 1e-9, "maxiter": 1000},
    )
    return result.x if result.success else None


def compute_efficient_frontier(
    mean_returns: npt.NDArray[np.float64],
    cov_matrix: npt.NDArray[np.float64],
    tickers: list[str],
    n_points: int,
    rf_annual_pct: float,
    current_weights: npt.NDArray[np.float64] | None = None,
    bounds: list[tuple[float, float]] | None = None,
) -> MarkowitzResult:
    """
    Compute the efficient frontier using Markowitz optimization.

    Generates n_points by sweeping target returns from min-variance to max-return.
    """
    n = len(tickers)
    rf_monthly = rf_annual_pct / 100 / 12

    # Min variance portfolio
    w_minvar = _optimize(mean_returns, cov_matrix, n, "min_variance", bounds=bounds)
    # Max sharpe portfolio
    w_maxsharpe = _optimize(
        mean_returns, cov_matrix, n, "max_sharpe", rf_monthly=rf_monthly, bounds=bounds
    )

    if w_minvar is None or w_maxsharpe is None:
        # Fallback to equal weight
        w_minvar = np.ones(n) / n
        w_maxsharpe = np.ones(n) / n

    ret_min, vol_min = _portfolio_stats(w_minvar, mean_returns, cov_matrix)
    ret_max = float(np.max(mean_returns)) * 12 * 100

    # Sweep target returns to trace frontier
    target_returns = np.linspace(ret_min, ret_max, n_points)
    frontier_points: list[EfficientFrontierPoint] = []

    for target in target_returns:
        w = _optimize(
            mean_returns, cov_matrix, n, "min_variance", target_return=target, bounds=bounds
        )
        if w is None:
            continue
        port_ret, port_vol = _portfolio_stats(w, mean_returns, cov_matrix)
        sharpe = (port_ret - rf_annual_pct) / port_vol if port_vol > 0 else 0.0
        frontier_points.append(
            EfficientFrontierPoint(
                return_pct=round(port_ret, 4),
                volatility_pct=round(port_vol, 4),
                sharpe_ratio=round(sharpe, 4),
                weights={t: round(float(w[i]) * 100, 2) for i, t in enumerate(tickers)},
            )
        )

    def make_point(w: npt.NDArray[np.float64]) -> EfficientFrontierPoint:
        r, v = _portfolio_stats(w, mean_returns, cov_matrix)
        sharpe = (r - rf_annual_pct) / v if v > 0 else 0.0
        return EfficientFrontierPoint(
            return_pct=round(r, 4),
            volatility_pct=round(v, 4),
            sharpe_ratio=round(sharpe, 4),
            weights={t: round(float(w[i]) * 100, 2) for i, t in enumerate(tickers)},
        )

    min_var_point = make_point(w_minvar)
    max_sharpe_point = make_point(w_maxsharpe)

    current_point: EfficientFrontierPoint | None = None
    if current_weights is not None:
        current_point = make_point(current_weights)

    # Correlation matrix
    std_devs = np.sqrt(np.diag(cov_matrix))
    corr = cov_matrix / np.outer(std_devs, std_devs)
    corr_dict = {
        t: {tickers[j]: round(float(corr[i, j]), 4) for j in range(n)}
        for i, t in enumerate(tickers)
    }

    # Per-asset stats
    asset_stats: dict[str, dict[str, float]] = {}
    for i, t in enumerate(tickers):
        ret = float(mean_returns[i]) * 12 * 100
        vol = float(std_devs[i]) * np.sqrt(12) * 100
        sharpe = (ret - rf_annual_pct) / vol if vol > 0 else 0.0
        asset_stats[t] = {
            "annual_return_pct": round(ret, 4),
            "annual_volatility_pct": round(vol, 4),
            "sharpe_ratio": round(sharpe, 4),
        }

    return MarkowitzResult(
        frontier=frontier_points,
        min_variance_portfolio=min_var_point,
        max_sharpe_portfolio=max_sharpe_point,
        current_portfolio=current_point,
        correlation_matrix=corr_dict,
        asset_stats=asset_stats,
    )
