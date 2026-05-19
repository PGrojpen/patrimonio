"""Monte Carlo simulation using Geometric Brownian Motion and Bootstrap."""

import numpy as np
import numpy.typing as npt

from app.schemas.risk import MonteCarloRequest, MonteCarloResult
from app.utils.financial import monthly_rate


def gbm_simulate(
    s0: float,
    mu: float,
    sigma: float,
    months: int,
    n_simulations: int = 10_000,
    contribution: float = 0.0,
    seed: int | None = None,
) -> npt.NDArray[np.float64]:
    """
    Geometric Brownian Motion with monthly contributions.

    Args:
        s0: Initial portfolio value
        mu: Annual drift (as decimal, e.g. 0.10 = 10%)
        sigma: Annual volatility (as decimal)
        months: Simulation horizon in months
        n_simulations: Number of Monte Carlo paths
        contribution: Monthly contribution (added after each step)
        seed: Random seed for reproducibility

    Returns:
        Matrix of shape (n_simulations, months+1) with portfolio values.
        First column is always s0.
    """
    rng = np.random.default_rng(seed)

    dt = 1 / 12  # monthly timestep
    # GBM drift correction: μ_dt = (μ - σ²/2) * dt
    mu_dt = (mu - 0.5 * sigma**2) * dt
    sigma_dt = sigma * np.sqrt(dt)

    # Random shocks: shape (n_simulations, months)
    z = rng.standard_normal((n_simulations, months))
    monthly_returns = np.exp(mu_dt + sigma_dt * z)  # (n_sim, months)

    # Build cumulative portfolio values with contributions
    paths = np.zeros((n_simulations, months + 1), dtype=np.float64)
    paths[:, 0] = s0

    for t in range(months):
        paths[:, t + 1] = paths[:, t] * monthly_returns[:, t] + contribution

    return paths


def bootstrap_simulate(
    s0: float,
    historical_returns: npt.NDArray[np.float64],
    months: int,
    n_simulations: int = 10_000,
    contribution: float = 0.0,
    seed: int | None = None,
) -> npt.NDArray[np.float64]:
    """
    Bootstrap simulation by sampling historical monthly returns.
    Preserves empirical distribution including fat tails and skewness.
    """
    rng = np.random.default_rng(seed)
    n_hist = len(historical_returns)

    # Sample with replacement: shape (n_simulations, months)
    indices = rng.integers(0, n_hist, size=(n_simulations, months))
    sampled = historical_returns[indices]  # decimal returns

    paths = np.zeros((n_simulations, months + 1), dtype=np.float64)
    paths[:, 0] = s0

    for t in range(months):
        paths[:, t + 1] = paths[:, t] * (1 + sampled[:, t]) + contribution

    return paths


def run_monte_carlo(request: MonteCarloRequest) -> MonteCarloResult:
    """Run Monte Carlo simulation and compute percentile bands."""
    mu = request.annual_return_pct / 100
    sigma = request.annual_volatility_pct / 100

    if request.method == "bootstrap" and request.historical_returns:
        hist = np.array(request.historical_returns, dtype=np.float64)
        paths = bootstrap_simulate(
            s0=request.initial_value,
            historical_returns=hist,
            months=request.months,
            n_simulations=request.n_simulations,
            contribution=request.monthly_contribution,
            seed=request.seed,
        )
    else:
        paths = gbm_simulate(
            s0=request.initial_value,
            mu=mu,
            sigma=sigma,
            months=request.months,
            n_simulations=request.n_simulations,
            contribution=request.monthly_contribution,
            seed=request.seed,
        )

    months_axis = list(range(request.months + 1))

    # Percentile bands along time axis
    p5 = np.percentile(paths, 5, axis=0).tolist()
    p25 = np.percentile(paths, 25, axis=0).tolist()
    p50 = np.percentile(paths, 50, axis=0).tolist()
    p75 = np.percentile(paths, 75, axis=0).tolist()
    p95 = np.percentile(paths, 95, axis=0).tolist()
    mean = np.mean(paths, axis=0).tolist()

    # Final distribution sample (max 2000 points for frontend histogram)
    final_vals = paths[:, -1]
    sample_size = min(2000, len(final_vals))
    rng_sample = np.random.default_rng(42)
    sample_idx = rng_sample.choice(len(final_vals), size=sample_size, replace=False)
    final_distribution = final_vals[sample_idx].tolist()

    # Probability of reaching target
    prob_target: float | None = None
    if request.target_value is not None:
        prob_target = float(np.mean(final_vals >= request.target_value))

    # Annualized stats from median path
    median_final = float(np.median(final_vals))
    n_years = request.months / 12
    ann_return = ((median_final / request.initial_value) ** (1 / n_years) - 1) * 100

    return MonteCarloResult(
        months=months_axis,
        p5=[round(v, 2) for v in p5],
        p25=[round(v, 2) for v in p25],
        p50=[round(v, 2) for v in p50],
        p75=[round(v, 2) for v in p75],
        p95=[round(v, 2) for v in p95],
        mean=[round(v, 2) for v in mean],
        final_distribution=[round(v, 2) for v in final_distribution],
        probability_of_reaching_target=round(prob_target, 4) if prob_target is not None else None,
        annualized_return_pct=round(ann_return, 2),
        annualized_volatility_pct=round(request.annual_volatility_pct, 2),
    )
