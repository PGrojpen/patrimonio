"""Monthly contribution simulator with compound interest and inflation adjustment."""

from datetime import date, timedelta

import numpy as np

from app.schemas.simulation import MonthlyDataPoint, SimulationRequest, SimulationResult
from app.utils.financial import monthly_rate


def simulate(request: SimulationRequest) -> SimulationResult:
    """
    Simulate portfolio growth with monthly contributions over time.

    Supports annual contribution increases and inflation adjustment.
    Uses compound interest with monthly precision.
    """
    months_total = request.years * 12
    r_monthly = monthly_rate(request.annual_rate_pct)
    r_inflation_monthly = monthly_rate(request.inflation_pct)

    series: list[MonthlyDataPoint] = []
    total_value = request.initial_investment
    total_invested = request.initial_investment
    current_contribution = request.monthly_contribution

    start_date = date.today().replace(day=1)

    for month in range(1, months_total + 1):
        # Annual contribution increase applied at start of each year
        if month > 1 and (month - 1) % 12 == 0 and request.annual_contribution_increase_pct > 0:
            current_contribution *= 1 + request.annual_contribution_increase_pct / 100

        # Apply monthly return then add contribution (beginning-of-month contribution)
        total_value = total_value * (1 + r_monthly) + current_contribution
        total_invested += current_contribution

        interest_earned = total_value - total_invested

        # Deflate to real value (base: start of simulation)
        real_value = total_value / (1 + r_inflation_monthly) ** month

        period_date = start_date + timedelta(days=30 * month)
        series.append(
            MonthlyDataPoint(
                month=month,
                date=period_date.strftime("%Y-%m"),
                total_invested=round(total_invested, 2),
                interest_earned=round(interest_earned, 2),
                total_value=round(total_value, 2),
                real_value=round(real_value, 2),
            )
        )

    final_value = total_value
    final_real_value = series[-1].real_value

    # CAGR nominal
    if request.initial_investment + (request.monthly_contribution * months_total) > 0:
        annualized_return = (
            (final_value / (request.initial_investment or final_value)) ** (1 / request.years) - 1
        ) * 100
    else:
        annualized_return = request.annual_rate_pct

    # CAGR real
    real_annualized = (
        (1 + annualized_return / 100) / (1 + request.inflation_pct / 100) - 1
    ) * 100

    return SimulationResult(
        total_invested=round(total_invested, 2),
        total_interest=round(final_value - total_invested, 2),
        final_value=round(final_value, 2),
        final_real_value=round(final_real_value, 2),
        annualized_return_pct=round(request.annual_rate_pct, 2),
        real_annualized_return_pct=round(real_annualized, 2),
        series=series,
    )
