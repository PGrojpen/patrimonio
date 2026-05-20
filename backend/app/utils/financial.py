"""Core financial math utilities."""

import numpy as np
import numpy.typing as npt


def monthly_rate(annual_rate_pct: float) -> float:
    """Convert annual rate (%) to monthly equivalent rate using compound formula."""
    return (1 + annual_rate_pct / 100) ** (1 / 12) - 1


def annualize_return(monthly_return: float) -> float:
    """Convert monthly return to annualized return (%)."""
    return ((1 + monthly_return) ** 12 - 1) * 100


def annualized_return_from_series(values: npt.NDArray[np.float64]) -> float:
    """Compute CAGR (%) from a value series (first element = start)."""
    if len(values) < 2 or values[0] <= 0:
        return 0.0
    n_years = (len(values) - 1) / 12
    return ((values[-1] / values[0]) ** (1 / n_years) - 1) * 100


def log_returns(prices: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    """Compute log returns from price series."""
    return np.diff(np.log(prices))


def simple_returns(prices: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    """Compute simple returns from price series."""
    return np.diff(prices) / prices[:-1]


def deflate_series(
    nominal: npt.NDArray[np.float64],
    monthly_inflation_pct: float,
) -> npt.NDArray[np.float64]:
    """Deflate a nominal value series by constant monthly inflation."""
    months = np.arange(len(nominal))
    deflator = (1 + monthly_inflation_pct / 100) ** months
    return nominal / deflator


def future_value_contribution(
    pv: float,
    pmt: float,
    rate: float,
    n: int,
) -> float:
    """
    Future value of initial investment + periodic contributions.

    Args:
        pv: Present value (initial investment)
        pmt: Periodic contribution (per period)
        rate: Rate per period (decimal)
        n: Number of periods
    """
    fv_pv = pv * (1 + rate) ** n
    if rate == 0:
        fv_pmt = pmt * n
    else:
        fv_pmt = pmt * ((1 + rate) ** n - 1) / rate
    return fv_pv + fv_pmt


def drawdown_series(values: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    """Compute drawdown series (underwater chart) from value series."""
    peak = np.maximum.accumulate(values)
    dd = (values - peak) / peak * 100
    return dd


def max_drawdown(values: npt.NDArray[np.float64]) -> float:
    """Compute maximum drawdown (%) from a value series."""
    dd = drawdown_series(values)
    return float(dd.min())


def should_rebalance(month: int, freq: str) -> bool:
    """
    Retorna True se o mês `month` é um evento de rebalanceamento.

    Frequências suportadas: 'none', 'monthly', 'quarterly', 'annual'.

    Nota: em carteiras com ativos tributáveis, o rebalanceamento real gera
    fato gerador de IR sobre o ganho realizado. Esta implementação ignora
    esse custo (simplificação v1 — ver issue TODO).
    """
    if freq == "none":
        return False
    if freq == "monthly":
        return True
    if freq == "quarterly":
        return month % 3 == 0
    if freq == "annual":
        return month % 12 == 0
    return False
