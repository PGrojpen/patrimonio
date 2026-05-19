"""Tests for Monte Carlo simulation engine."""

import numpy as np
import pytest

from app.schemas.risk import MonteCarloRequest
from app.services.monte_carlo import bootstrap_simulate, gbm_simulate, run_monte_carlo


class TestGBM:
    def test_output_shape(self):
        paths = gbm_simulate(s0=10_000, mu=0.10, sigma=0.20, months=120, n_simulations=100)
        assert paths.shape == (100, 121)  # n_sim x (months+1)

    def test_initial_value_correct(self):
        paths = gbm_simulate(s0=50_000, mu=0.12, sigma=0.15, months=60, n_simulations=500)
        assert np.all(paths[:, 0] == 50_000)

    def test_positive_drift_increases_median(self):
        paths = gbm_simulate(s0=10_000, mu=0.10, sigma=0.05, months=120, n_simulations=1000, seed=42)
        initial = paths[:, 0].mean()
        final = np.median(paths[:, -1])
        assert final > initial

    def test_with_contribution_grows_faster(self):
        no_contrib = gbm_simulate(s0=10_000, mu=0.10, sigma=0.15, months=120, n_simulations=500, seed=0)
        with_contrib = gbm_simulate(s0=10_000, mu=0.10, sigma=0.15, months=120, n_simulations=500, contribution=500, seed=0)
        assert np.median(with_contrib[:, -1]) > np.median(no_contrib[:, -1])

    def test_seed_reproducibility(self):
        p1 = gbm_simulate(s0=10_000, mu=0.10, sigma=0.20, months=60, n_simulations=100, seed=42)
        p2 = gbm_simulate(s0=10_000, mu=0.10, sigma=0.20, months=60, n_simulations=100, seed=42)
        np.testing.assert_array_equal(p1, p2)

    def test_zero_volatility_deterministic(self):
        paths = gbm_simulate(s0=10_000, mu=0.10, sigma=0.0001, months=12, n_simulations=10, seed=1)
        # Very low vol: all paths should be very close
        std = np.std(paths[:, -1])
        assert std < 1000  # close paths

    def test_all_values_positive(self):
        paths = gbm_simulate(s0=100, mu=-0.05, sigma=0.30, months=60, n_simulations=500, seed=7)
        # GBM guarantees positive prices
        assert np.all(paths > 0)


class TestBootstrap:
    def test_output_shape(self):
        hist = np.random.default_rng(0).normal(0.01, 0.04, 120)
        paths = bootstrap_simulate(s0=10_000, historical_returns=hist, months=60, n_simulations=100)
        assert paths.shape == (100, 61)

    def test_initial_value_correct(self):
        hist = np.array([0.01] * 60)
        paths = bootstrap_simulate(s0=5_000, historical_returns=hist, months=24, n_simulations=50)
        assert np.all(paths[:, 0] == 5_000)


class TestRunMonteCarlo:
    def make_request(self, **kwargs) -> MonteCarloRequest:
        defaults = {
            "initial_value": 10_000,
            "monthly_contribution": 500,
            "months": 120,
            "annual_return_pct": 10.0,
            "annual_volatility_pct": 20.0,
            "n_simulations": 1000,
            "seed": 42,
        }
        defaults.update(kwargs)
        return MonteCarloRequest(**defaults)

    def test_percentile_ordering(self):
        result = run_monte_carlo(self.make_request())
        for i in range(len(result.months)):
            assert result.p5[i] <= result.p25[i]
            assert result.p25[i] <= result.p50[i]
            assert result.p50[i] <= result.p75[i]
            assert result.p75[i] <= result.p95[i]

    def test_months_list_length(self):
        result = run_monte_carlo(self.make_request(months=60))
        assert len(result.months) == 61  # 0..60

    def test_probability_of_target(self):
        result = run_monte_carlo(self.make_request(target_value=1_000_000))
        assert result.probability_of_reaching_target is not None
        assert 0 <= result.probability_of_reaching_target <= 1

    def test_high_target_low_probability(self):
        result = run_monte_carlo(self.make_request(
            initial_value=1_000,
            monthly_contribution=100,
            months=12,
            annual_return_pct=5.0,
            target_value=1_000_000,
        ))
        assert result.probability_of_reaching_target < 0.01

    def test_bootstrap_method(self):
        hist = list(np.random.default_rng(0).normal(0.01, 0.04, 100))
        req = self.make_request(method="bootstrap", historical_returns=hist)
        result = run_monte_carlo(req)
        assert len(result.p50) == 121

    def test_final_distribution_sampled(self):
        result = run_monte_carlo(self.make_request())
        assert len(result.final_distribution) <= 2000
        assert all(v > 0 for v in result.final_distribution)
