"""IPCA-based inflation adjustment utilities."""

import numpy as np
import numpy.typing as npt


def deflate_value(
    nominal_value: float,
    cumulative_inflation_pct: float,
) -> float:
    """Convert nominal to real value given cumulative inflation (%)."""
    return nominal_value / (1 + cumulative_inflation_pct / 100)


def deflate_series_variable(
    nominal_series: npt.NDArray[np.float64],
    monthly_ipca_series: npt.NDArray[np.float64],
) -> npt.NDArray[np.float64]:
    """
    Deflate a nominal value series using a variable monthly IPCA series.

    Args:
        nominal_series: Array of nominal values (length N)
        monthly_ipca_series: Monthly IPCA rates as decimals (length N)
            e.g. [0.0054, 0.0032, ...]

    Returns:
        Real values in base-period prices.
    """
    cumulative = np.cumprod(1 + monthly_ipca_series)
    # Prepend 1.0 so index 0 = base period (no deflation)
    cumulative = np.insert(cumulative, 0, 1.0)[: len(nominal_series)]
    return nominal_series / cumulative


def real_return_from_nominal(
    nominal_return_pct: float,
    inflation_pct: float,
) -> float:
    """Fisher equation: real return from nominal return and inflation."""
    return ((1 + nominal_return_pct / 100) / (1 + inflation_pct / 100) - 1) * 100


def purchasing_power_loss(
    years: int,
    annual_inflation_pct: float,
) -> float:
    """Calculate % purchasing power lost over N years at constant inflation."""
    return (1 - 1 / (1 + annual_inflation_pct / 100) ** years) * 100
