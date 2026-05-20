"""Tests for the monthly contribution simulator."""

import pytest

from app.schemas.simulation import SimulationRequest
from app.services.simulator import simulate


def make_request(**kwargs) -> SimulationRequest:
    defaults = {
        "initial_investment": 0,
        "monthly_contribution": 500,
        "annual_contribution_increase_pct": 0,
        "years": 10,
        "annual_rate_pct": 12.0,
        "inflation_pct": 4.5,
    }
    defaults.update(kwargs)
    return SimulationRequest(**defaults)


class TestSimulator:
    def test_basic_simulation_returns_correct_months(self):
        result = simulate(make_request(years=5))
        assert len(result.series) == 60  # 5 * 12

    def test_total_invested_equals_contribution_times_months(self):
        req = make_request(initial_investment=0, monthly_contribution=500, years=10)
        result = simulate(req)
        expected = 500 * 120
        assert abs(result.total_invested - expected) < 1

    def test_initial_investment_included_in_total(self):
        req = make_request(initial_investment=10_000, monthly_contribution=500, years=5)
        result = simulate(req)
        assert result.total_invested >= 10_000

    def test_final_value_greater_than_total_invested(self):
        result = simulate(make_request(annual_rate_pct=10.0, years=10))
        assert result.final_value > result.total_invested

    def test_zero_rate_final_equals_invested(self):
        req = make_request(annual_rate_pct=0.0, years=5, initial_investment=0)
        result = simulate(req)
        assert abs(result.final_value - result.total_invested) < 1

    def test_interest_earned_is_positive(self):
        result = simulate(make_request(annual_rate_pct=10.0, years=5))
        assert result.total_interest > 0

    def test_real_value_less_than_nominal_with_inflation(self):
        result = simulate(make_request(annual_rate_pct=10.0, inflation_pct=5.0, years=10))
        assert result.final_real_value < result.final_value

    def test_monthly_series_is_monotonically_increasing(self):
        result = simulate(make_request(annual_rate_pct=10.0, years=5))
        values = [dp.total_value for dp in result.series]
        assert all(values[i] <= values[i + 1] for i in range(len(values) - 1))

    def test_annual_contribution_increase(self):
        """With annual contribution increase, total invested > base case."""
        base = simulate(make_request(annual_contribution_increase_pct=0))
        with_increase = simulate(make_request(annual_contribution_increase_pct=10))
        assert with_increase.total_invested > base.total_invested
        assert with_increase.final_value > base.final_value

    def test_series_month_numbers_correct(self):
        result = simulate(make_request(years=3))
        assert result.series[0].month == 1
        assert result.series[-1].month == 36

    def test_high_initial_investment(self):
        req = SimulationRequest(
            initial_investment=1_000_000,
            monthly_contribution=1,
            annual_contribution_increase_pct=0,
            years=10,
            annual_rate_pct=10.0,
            inflation_pct=4.5,
        )
        result = simulate(req)
        assert result.final_value > 1_000_000

    def test_pedro_scenario(self):
        """Pedro, 26 anos, aporta R$500/mês por 30 anos, 60/30/10 allocation ~11% aa."""
        req = SimulationRequest(
            initial_investment=5_000,
            monthly_contribution=500,
            annual_contribution_increase_pct=5.0,
            years=30,
            annual_rate_pct=11.0,
            inflation_pct=4.5,
        )
        result = simulate(req)
        assert result.final_value > 1_000_000  # should become millionaire
        assert result.real_annualized_return_pct > 0


class TestSimulationValidation:
    def test_negative_monthly_contribution_raises(self):
        with pytest.raises(Exception):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=-100,
                annual_contribution_increase_pct=0,
                years=10,
                annual_rate_pct=10.0,
                inflation_pct=4.5,
            )

    def test_zero_years_raises(self):
        with pytest.raises(Exception):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=500,
                annual_contribution_increase_pct=0,
                years=0,
                annual_rate_pct=10.0,
                inflation_pct=4.5,
            )

    def test_rate_above_100_raises(self):
        with pytest.raises(Exception):
            SimulationRequest(
                initial_investment=0,
                monthly_contribution=500,
                annual_contribution_increase_pct=0,
                years=10,
                annual_rate_pct=101.0,
                inflation_pct=4.5,
            )
